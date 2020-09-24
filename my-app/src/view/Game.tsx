import React, { useCallback, useEffect, useState } from 'react'
import LineTo from 'react-lineto';
import { useDispatch, useSelector } from 'react-redux';

import './_style.css';
import { ClientState, HAND, LIBRARY, whichZone, GRAVEYARD, EXILE } from '../ClientState';
import {
    clearLines,
    drawing,
    setUserPrefs,
    setGame,
    TOGGLE_FACEDOWN_CARD,
    TOGGLE_TRANSFORM_CARD, togglePlaymat, updateGame, UNTAP_ALL, SET_CARD_COUNTER, CREATE_TOKEN, MULLIGAN, setGameId
} from '../Actions';
import CardPopup from './CardPopup';
import CustomDragLayer from './CustomDragLayer';
import { useConfirmation } from './ConfirmationService';
import { ConfirmationResult } from './ConfirmationDialog';
import { usePlayerActions } from '../PlayerDispatch';
import { Game, Card } from "../magic_models";
import Hand from './Hand';
import Table from './Table';
import CardDB, { parseDeckCard } from "../CardDB";
import MySocket from "../MySocket";
import { OptionsDialog } from './OptionsDialog';

interface GameViewProps {
    gameId: string|null
}

const GameView: React.FC<GameViewProps> = ({gameId}) => {
    const [userName, rightClickPopup]: [string|undefined, boolean] = useSelector((state: ClientState) =>
        [state.playerPrefs.name as string | undefined, state.playerPrefs.rightClickPopup])
    const hoveredCard = useSelector((state: ClientState) => state.hoveredCard)
    const cardUnderCursor = useSelector((state: ClientState) =>
        state.hoveredCard.cardId != null ? state.game.cards[state.hoveredCard.cardId] : null)
    const isDrawing = useSelector((state: ClientState) => state.drawing.first !== null)
    const drawLines = useSelector((state: ClientState) => state.drawing.lines)
    const players = useSelector((state: ClientState) => state.game.players)
    const srcZone = useSelector((state: ClientState) =>
        cardUnderCursor ? whichZone(cardUnderCursor.card_id, state.game) : null)

    const [cardPopupShown, setCardPopupShown] = useState<number | null>(null)
    const [cardPopupTransformed, setCardPopupTransformed] = useState(false)
    const [hasSockets, setHasSockets] = useState(false)

    const dispatch = useDispatch()
    const { action: playerDispatch, baseAction, draw: drawDispatch } = usePlayerActions()
    const [loadedId, setLoadedId] = useState('')
    const [optionsOpen, setOptionsOpen] = useState(false)

    const confirmation = useConfirmation();

    const loadGame = useCallback(
        () => {
            const loadOptions = () => {
                let bfImageQuality = localStorage.getItem('bfImageQuality')
                bfImageQuality = bfImageQuality ? bfImageQuality : "normal" // todo remove low everywhere
                let bfCardSize = localStorage.getItem('bfCardSize')
                bfCardSize = bfCardSize ? bfCardSize : "7"
                let handCardSize = localStorage.getItem('handCardSize')
                handCardSize = handCardSize ? handCardSize : "14"
                let rightClickPopup = localStorage.getItem('rightClickPopup') === 'true'
                rightClickPopup = rightClickPopup ? rightClickPopup : true;
                dispatch(setUserPrefs({ bfImageQuality, bfCardSize, handCardSize, rightClickPopup }))
            }

            const gameUrl = `${process.env.REACT_APP_API_URL}/api/table/${gameId}`
            const cardsUrl = `${process.env.REACT_APP_API_URL}/api/table/${gameId}/cards`

            async function onGameLoaded(r: Response) {
                loadOptions()
                await CardDB.loadCards(cardsUrl)
                // now that cards are loaded, initialize the game
                const data = r.json()
                const game: Game = await data
                dispatch(setGame(game))
                dispatch(setGameId(gameId as string))
            }

            console.log(`loading game from ${gameUrl}`)
            fetch(gameUrl).then(
                onGameLoaded
            ).catch(r => console.error("exception loading game", r))
            setLoadedId(gameId as string)
        },
        [gameId, dispatch],
    );


    useEffect(() => {
        if (loadedId !== gameId) {
            loadGame()
        }
    }, [loadGame, gameId, loadedId]);

    useEffect(() => {
        const playerNames = Object.keys(players)
        if (!userName && playerNames.length > 0) {
            playerNames.push('Spectator *')
            confirmation({
                title: "Who are you?",
                description: "Please select from existing players, else use /login to join the game.",
                choices: playerNames,
                catchOnCancel: true
            })
                .then((s: ConfirmationResult) => {
                    if (players.hasOwnProperty(s.choice)) {
                        dispatch(setUserPrefs({ name: s.choice }))
                    } else if (s.choice === 'Spectator *') {
                        dispatch(setUserPrefs({ name: `(${s.s})` }))
                    }
                })
                .catch(() => null)
        }
    },
        // since it wants confirmation but that changes every render and infinite loops
        // eslint-disable-next-line
        [userName, players, dispatch])

    useEffect(() => {
        if (userName && Object.keys(players).length > 0 && !hasSockets) {
            // if we have already loaded a real game object, now it is socket time
            connectSockets();
            setHasSockets(true);
        }

        function connectSockets() {
            try {
                console.log('Connecting sockets...')
                // now that game is loaded, register for updates to it
                MySocket.get_socket().emit('join', { table: gameId, username: userName })
                MySocket.get_socket().on('game_update', function (msg: string) {
                    const game_update = JSON.parse(msg)
                    console.log('received game_update', game_update)
                    dispatch(updateGame(game_update));
                })
                MySocket.get_socket().on('player_draw', function (msg: object) {
                    console.log('received player_draw', msg)
                    return dispatch(msg);
                })
                MySocket.get_socket().on('joined', function (msg: { table: string, username: string }) {
                    if (!msg.username.startsWith('(') && !players.hasOwnProperty(msg.username)) {
                        // new player joined table since we loaded it, need to reload table data
                        console.log(`reloading since ${msg.username} joined ${Object.keys(players)}`)
                        loadGame()
                    }
                })
                MySocket.get_socket().on('error', function (msg: any) {
                    console.log('received error', msg)
                })
            } catch (e) {
                console.error(e)
            }
        }
    }, [gameId, userName, players, hasSockets, dispatch, loadGame])

    const drawArrow = () => {
        dispatch(drawing(''))
    }

    const drawerColor = useSelector((state: ClientState) => state.game.players.hasOwnProperty(state.playerPrefs.name)
        ? state.game.players[state.playerPrefs.name].color
        : "gray")
    const clearMyLines = () => {
        drawDispatch(clearLines(drawerColor))
    }

    const topCard = useSelector((state: ClientState) => {
        const player = state.playerPrefs.name ? state.game.players[state.playerPrefs.name] : null
        if (!player) return
        const library = Object.values(state.game.zones).filter(z => z.owner === userName && z.name === LIBRARY).pop()
        return library?.cards[0]
    })

    function drawCard() {
        const player = userName ? players[userName] : null
        if (!userName || !player || topCard === undefined) return
        const cardMove = {
            card_id: topCard,
            src_zone: LIBRARY,
            src_owner: userName,
            tgt_zone: HAND,
            tgt_owner: userName,
            to_idx: 0 // put first
        }
        playerDispatch({ ...baseAction(), kind:"Draw 1", card_moves: [cardMove] })
    }

    function moveCard(tgt_zone: string, to_idx: number | null) {
        if (!cardUnderCursor) return
        if (!srcZone) return
        const cardMove = {
            card_id: cardUnderCursor.card_id,
            src_zone: srcZone.zone.name,
            src_owner: srcZone.zone.owner,
            tgt_zone,
            tgt_owner: cardUnderCursor.owner,
            to_idx
        }
        playerDispatch({ ...baseAction(), card_moves: [cardMove] })
    }

    const mulliganDialog = () => {
        if (!userName) return
        const choices = ["London"]
        confirmation({
            choices,
            catchOnCancel: true,
            title: "Mulligan",
            description: "Other mulligan styles must be down manually."
        }).then((s: ConfirmationResult) => {
            switch(s.choice) {
                case "London":
                    playerDispatch({
                        ...baseAction(),
                        kind: MULLIGAN
                    })
                break;
            }
        }).catch(()=>null)
    }

    const tokenPopup = () => {
        if (!userName) return
        const choices = cardUnderCursor && !cardUnderCursor.facedown ? ["Copy " + CardDB.getCard(cardUnderCursor.sf_id).name] : []
        choices.push("New Token $")
        confirmation({
            choices: choices,
            catchOnCancel: true,
            title: "Create Token",
            description: ""
        }).then((s: ConfirmationResult) => {
            switch (s.choice.split(' ')[0]) {
                case "Copy":
                    playerDispatch({
                        ...baseAction(),
                        kind: CREATE_TOKEN,
                        create_tokens: [{
                            owner: userName,
                            sf_id: (cardUnderCursor as Card).sf_id
                        }]
                    })
                    break;
                case "New":
                    const deck_card = parseDeckCard(s.s)
                    try {
                        let foundCard = CardDB.findCardNow(deck_card.name, deck_card.set_name, deck_card.number);
                        playerDispatch({
                            ...baseAction(),
                            kind: CREATE_TOKEN,
                            create_tokens: [{
                                owner: userName,
                                sf_id: foundCard.sf_id
                            }]
                        })
                    } catch (e) {
                        console.error(`Card not found: ${s.s}`)
                    }
                    break;
            }
        }).catch(() => null);
    }

    const counterPopup = (cardId: number) => {
        confirmation({
            choices: ["+1/+1", "+1/+0", "-1/-1", "Create * _"],
            catchOnCancel: true,
            title: "Create Counter",
            description: ""
        })
            .then((s: ConfirmationResult) => {
                const newCounter = {
                    player: null,
                    card_id: cardId,
                    name: s.s,
                    value: 0
                }
                switch (s.choice) {
                    case "Create * _":
                        newCounter.name = s.s
                        newCounter.value = s.n
                        break;
                    default:
                        newCounter.name = s.choice
                        newCounter.value = s.n
                        break;
                }
                playerDispatch({
                    ...baseAction(),
                    kind: SET_CARD_COUNTER,
                    counter_changes: [newCounter]
                })
            })
            .catch(() => null);
    }

    const isHoveredCard = !(hoveredCard.cardId === null || hoveredCard.cardId === undefined)

    function hidePlayerPrompt() {
        confirmation({
            choices: Object.keys(players),
            catchOnCancel: true,
            title: "Hide Player",
            description: "Remove a player's playmat from your screen. (Or show a hidden one.)"
        })
            .then((s: ConfirmationResult) => {
                dispatch(togglePlaymat(s.choice))
            });
    }

    function togglePopup() {
        if (cardPopupShown === hoveredCard.cardId || (cardPopupShown != null && !isHoveredCard)) {
            setCardPopupShown(null) // view again to close or event anywhere to close
            return true;
        } else if (isHoveredCard) {
            setCardPopupShown(hoveredCard.cardId)
            setCardPopupTransformed(false)
            return true;
        }
        return false;
    }

    const keypressListener = (event: KeyboardEvent) => {
        if (event.target) {
            if ( ["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).nodeName)){
                return; // key should go to that text input box
            }
        }

        switch (event.key) {
            case 'v':
                if (togglePopup()) event.preventDefault();
                break;
            case 'T':
                if (isHoveredCard) {
                    playerDispatch({
                        ...baseAction(),
                        card_changes: [{ change: TOGGLE_TRANSFORM_CARD, card_id: hoveredCard.cardId as number, to_x: null, to_y: null }]
                    })
                    event.preventDefault()
                }
                break;
            case 'U':
                playerDispatch({ ...baseAction(), kind: UNTAP_ALL })
                event.preventDefault()
                break;
            case 'F':
                if (isHoveredCard) {
                    playerDispatch({
                        ...baseAction(),
                        card_changes: [{ change: TOGGLE_FACEDOWN_CARD, card_id: hoveredCard.cardId as number, to_x: null, to_y: null }]
                    })
                    event.preventDefault()
                }
                break;
            case 'C':
                tokenPopup()
                event.preventDefault()
                break;
            case 'c':
                if (hoveredCard.cardId !== null && hoveredCard.cardId !== undefined) {
                    counterPopup(hoveredCard.cardId)
                    event.preventDefault()
                }
                break;
            case 'a':
                drawArrow()
                event.preventDefault()
                break;
            case 'A':
                clearMyLines()
                event.preventDefault()
                break;
            case 'D':
                drawCard()
                event.preventDefault()
                break;
            case 'B':
                moveCard(LIBRARY, null) // bottom
                event.preventDefault()
                break;
            case 'G':
                moveCard(GRAVEYARD, 0) // top, face up stack IRL
                event.preventDefault()
                break;
            case 'E':
                moveCard(EXILE, 0)
                event.preventDefault()
                break;
            case 'M':
                mulliganDialog()
                event.preventDefault()
                break;
            case 'H':
                hidePlayerPrompt()
                event.preventDefault()
                break;
            case 'O':
                setOptionsOpen(true)
                event.preventDefault()
                break;
        }
    }

    const onContextMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (event.button === 2 && rightClickPopup) {
            if (togglePopup()) event.preventDefault();
        }
    }

    const lines = drawLines
        .map(entityLine => <LineTo key={`${entityLine.from}-${entityLine.to}`} from={entityLine.from} to={entityLine.to}
            borderColor={entityLine.color} borderWidth={2}
            className={"Line"}
        />)

    useEffect(() => {
        window.addEventListener("keypress", keypressListener, true);
        return () => window.removeEventListener("keypress", keypressListener, true);
        });

    //tabIndex means it can receive focus which means it can receive keyboard events
    return userName
        ? (
            <div className="Game" onContextMenu={onContextMenu} tabIndex={0} style={{
                cursor: isDrawing ? "crosshair" : undefined
            }}>
                <Table />
                {players.hasOwnProperty(userName) ? <Hand /> : null}
                {lines}
                {cardPopupShown !== null
                    ? <CardPopup cardId={cardPopupShown} transformed={cardPopupTransformed} />
                    : undefined}
                <CustomDragLayer />
                {optionsOpen ? <OptionsDialog onClose={() => setOptionsOpen(false)} /> : undefined}
            </div>
        )
        : <div />
}

export default GameView