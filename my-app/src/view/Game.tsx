import React, {useCallback, useEffect, useState} from 'react'
import LineTo from 'react-lineto';

import './_style.css';
import Hand from './Hand';
import Table from './Table';
import {useDispatch, useSelector} from 'react-redux';
import {ClientState, HAND, index_game, LIBRARY} from '../ClientState';
import {
    cardAction, clearLines,
    createTokenCopy,
    createTokenNew, drawing,
    setUserPrefs, MOVE_CARD,
    PlayerAction,
    setCardCounter,
    setGame,
    TOGGLE_FACEDOWN_CARD,
    TOGGLE_TRANSFORM_CARD, untapAll
} from '../Actions';
import CardPopup from './CardPopup';
import CustomDragLayer from './CustomDragLayer';
import {useConfirmation} from './ConfirmationService';
import {ConfirmationResult} from './ConfirmationDialog';
import {usePlayerDispatch} from '../PlayerDispatch';
import {useParams} from "react-router-dom";
import {Game as GameT} from "../magic_models";
import CardDB, {parseDeckCard} from "../CardDB";
import MySocket from "../MySocket";

const Game: React.FC = () => {
    const userName = useSelector((state: ClientState) => state.playerPrefs.name) as string | undefined
    const hoveredCard = useSelector((state: ClientState) => state.hoveredCard)
    const cardUnderCursor = useSelector((state: ClientState) =>
        state.hoveredCard.cardId ? state.game.cards[state.hoveredCard.cardId] : null)
    const isDrawing = useSelector((state: ClientState) => state.drawing.first !== null)
    const drawLines = useSelector((state: ClientState) => state.drawing.lines)
    const players = useSelector((state: ClientState) => state.game.players)

    const [cardPopupShown, setCardPopupShown] = useState<number | null>(null)
    const [cardPopupTransformed, setCardPopupTransformed] = useState(false)
    const [hasSockets, setHasSockets] = useState(false)

    const dispatch = useDispatch()
    const {action: playerDispatch, draw: drawDispatch} = usePlayerDispatch()
    const {gameId} = useParams()
    const [loadedId, setLoadedId] = useState('')

    const confirmation = useConfirmation();

    const loadGame = useCallback(
        () => {
            // enable testing off static assets
            const gameUrl = gameId === 'static_test' ? '/testGame.json' : `/api/table/${gameId}`
            const actionsUrl = gameId === 'static_test' ? '/testActions.json' : `/api/table/${gameId}/actions`
            const cardsUrl = gameId === 'static_test' ? '/testCards.json' : `/api/table/${gameId}/cards`

            async function onGameLoaded(r: Response) {
                await CardDB.loadCards(cardsUrl)
                // now that cards are loaded, load the game
                const data = r.json()
                const game: GameT = await data
                let indexedGame = index_game(game);
                dispatch(setGame(indexedGame))

                fetch(actionsUrl)
                    .then(onActionsLoaded)
                    .catch(r => console.error("exception loading game actions", r))
            }

            async function onActionsLoaded(r: Response) {
                // replay any actions
                const actions = await r.json() as any[]
                console.log(`${actions.length} actions loaded from server, catching up now ...`)
                for (const action of actions) {
                    try {
                        dispatch(action)
                    } catch (e) {
                        console.error('Problem dispatching', action, e)
                    }
                }
                console.log(`caught up on ${actions.length} actions loaded from server`)
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
            if (userName === undefined && playerNames.length > 0) {
                playerNames.push('Spectator *')
                confirmation({
                    title: "Who are you?",
                    description: "Please select from existing players, else use /login to join the game.",
                    choices: playerNames,
                    catchOnCancel: true
                })
                    .then((s: ConfirmationResult) => {
                        if (players.hasOwnProperty(s.choice)) {
                            dispatch(setUserPrefs(s.choice, players[s.choice].color))
                        } else if (s.choice === 'Spectator *') {
                            dispatch(setUserPrefs(`(${s.s})`, "gray"))
                        }
                    })
                    .catch(() => null)
            }
        },
        // since it wants confirmation but that changes every render and infinite loops
        // eslint-disable-next-line
        [userName, players, dispatch])

    useEffect(() => {
        if (gameId !== 'static_test' && userName !== undefined && Object.keys(players).length > 0 && !hasSockets) {
            // if we have already loaded a real game object, now it is socket time
            connectSockets();
            setHasSockets(true);
        }

        function connectSockets() {
            try {
                console.log('Connecting sockets...')
                // now that game is loaded, register for updates to it
                MySocket.get_socket().emit('join', {table: gameId, username: userName})
                MySocket.get_socket().on('player_action', function (msg: PlayerAction) {
                    console.log('received player_action', msg)
                    return dispatch(msg);
                })
                MySocket.get_socket().on('player_draw', function (msg: object) {
                    console.log('received player_draw', msg)
                    return dispatch(msg);
                })
                MySocket.get_socket().on('joined', function (msg: { table: string, username: string }) {
                    if (msg.username.startsWith('(') && !players.hasOwnProperty(msg.username)) {
                        // new player joined table since we loaded it, need to reload table data
                        console.log(`reloading since ${msg.username} joined ${Object.keys(players)}`)
                        loadGame()
                    }
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
        if (!player || topCard === undefined) return
        const cardMove = {
            type: MOVE_CARD,
            cardId: topCard,
            srcZone: LIBRARY,
            srcOwner: userName,
            tgtZone: HAND,
            tgtOwner: userName,
            toIdx: 0 // put first
        }
        playerDispatch(cardMove)
    }

    const tokenPopup = () => {
        if (userName === undefined) return
        const choices = cardUnderCursor ? ["Copy " + CardDB.getCard(cardUnderCursor.sf_id).name] : []
        choices.push("New Token $")
        confirmation({
            choices: choices,
            catchOnCancel: true,
            title: "Create Token",
            description: ""
        }).then((s: ConfirmationResult) => {
            switch (s.choice.split(' ')[0]) {
                case "Copy":
                    playerDispatch(createTokenCopy(userName, hoveredCard.cardId as number));
                    break;
                case "New":
                    const deck_card = parseDeckCard(s.s)
                    try {
                        let foundCard = CardDB.findCardNow(deck_card.name, deck_card.set_name, deck_card.number);
                        playerDispatch(createTokenNew(userName, foundCard.sf_id))
                    } catch (e) {
                        console.error(`Card not found: ${s.s}`)
                    }
                    break;
            }
        })
            .catch(() => null);
    }

    const counterPopup = (bfCardId: number) => {
        confirmation({
            choices: ["+1/+1", "+1/+0", "+0/+1", "Create * _"],
            catchOnCancel: true,
            title: "Create Counter",
            description: ""
        })
            .then((s: ConfirmationResult) => {
                switch (s.choice) {
                    case "Create * _":
                        playerDispatch(setCardCounter(bfCardId, s.s, s.n));
                        break;
                    default:
                        playerDispatch(setCardCounter(bfCardId, s.choice, s.n));
                        return;
                }
            })
            .catch(() => null);
    }

    const isHoveredCard = !(hoveredCard.cardId === null || hoveredCard.cardId === undefined)

    const keyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case 'v':
                if (cardPopupShown === hoveredCard.cardId || (cardPopupShown != null && !isHoveredCard)) {
                    setCardPopupShown(null) // view again to close or 'v' anywhere to close
                    event.preventDefault()
                } else if (isHoveredCard) {
                    setCardPopupShown(hoveredCard.cardId)
                    setCardPopupTransformed(false)
                    event.preventDefault()
                }
                break;
            case 'T':
                if (isHoveredCard) {
                    playerDispatch(cardAction(TOGGLE_TRANSFORM_CARD, hoveredCard.cardId as number, hoveredCard.bfId === null))
                    event.preventDefault()
                }
                break;
            case 'U':
                playerDispatch(untapAll())
                break;
            case 'F':
                if (isHoveredCard) {
                    playerDispatch(cardAction(TOGGLE_FACEDOWN_CARD, hoveredCard.cardId as number, hoveredCard.bfId === null))
                    event.preventDefault()
                }
                break;
            case 'C':
                tokenPopup()
                event.preventDefault()
                break;
            case 'c':
                if (hoveredCard.bfId !== null && hoveredCard.bfId !== undefined) {
                    counterPopup(hoveredCard.bfId)
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
        }
    }

    const lines = drawLines
        .map(entityLine => <LineTo key={`${entityLine.from}-${entityLine.to}`} from={entityLine.from} to={entityLine.to}
                                   borderColor={entityLine.color} borderWidth={2}
                                   className={"Line"}
        />)

    //tabIndex means it can receive focus which means it can receive keyboard events
    return userName
        ? (
            <div className="Game" onKeyPress={keyPress} tabIndex={0} style={{
                cursor: isDrawing ? "crosshair" : undefined
            }}>
                <Table/>
                {players.hasOwnProperty(userName) ? <Hand/> : null}
                {cardPopupShown !== null
                    ? <CardPopup cardId={cardPopupShown} transformed={cardPopupTransformed}/>
                    : undefined}
                {lines}
                <CustomDragLayer/>
            </div>
        )
        : <div/>
}

export default Game