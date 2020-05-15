import React, {useCallback, useEffect, useState} from 'react'
import LineTo from 'react-lineto';

import './_style.css';
import Hand from './Hand';
import Table from './Table';
import {useDispatch, useSelector} from 'react-redux';
import {ClientState, index_game} from '../ClientState';
import {
    cardAction,
    createTokenCopy,
    createTokenNew, drawing,
    localStateLoaded,
    PlayerAction,
    setCardCounter,
    setGame,
    TOGGLE_FACEDOWN_CARD,
    TOGGLE_TRANSFORM_CARD
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
    const isDrawing = useSelector((state: ClientState) => state.drawStage > 0)
    const drawLines = useSelector((state: ClientState) => state.drawLines)
    const players = useSelector((state: ClientState) => state.game.players)

    const [cardPopupShown, setCardPopupShown] = useState<number | null>(null)
    const [cardPopupTransformed, setCardPopupTransformed] = useState(false)
    const [hasSockets, setHasSockets] = useState(false)

    // todo finish line support for drawing to indicate attacks / spell targets
    // do need to emit & broadcast, don't save. store in clientState (not game)
    // need lines for attacks definitely
    // need a way for a player to clear their lines, need lines colored to player color in state

    const dispatch = useDispatch()
    const playerDispatch = usePlayerDispatch()
    const {gameId} = useParams()


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

            //function loadGame() {
            console.log(`loading game from ${gameUrl}`)
            fetch(gameUrl).then(
                onGameLoaded
            ).catch(r => console.error("exception loading game", r))
            //}
        },
        [gameId, dispatch],
    );


    useEffect(() => {
        // initial load effect only, prevents "too many re-renders error"
        if (userName !== undefined)
            return
        const u = localStorage.getItem('userName') || 'onlooker'
        const c = localStorage.getItem('userColor') || 'Gray'
        if (u && c) dispatch(localStateLoaded(u, c))

        loadGame()
    }, [userName, dispatch, loadGame]);

    useEffect(() => {
        if (gameId !== 'static_test' && userName !== undefined && players.hasOwnProperty(userName) && !hasSockets) {
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
                    console.log('received', msg)
                    return dispatch(msg);
                })
                MySocket.get_socket().on('joined', function (msg: { table: string, username: string }) {
                    if (msg.username !== 'onlooker' && !players.hasOwnProperty(msg.username)) {
                        // new player joined table since we loaded it, need to reload table data
                        console.log(`reloading since ${msg.username} joined ${Object.keys(players)}`)
                        loadGame()
                    }
                })
            } catch (e) {
                console.error(e)
            }
        }
    }, [gameId, userName, hasSockets, players, dispatch, loadGame])

    const drawArrow = () => {
        dispatch(drawing(1))
    }

    const confirmation = useConfirmation();

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

    const keyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case 'v':
                if (cardPopupShown === hoveredCard.cardId) {
                    setCardPopupShown(null) // view again to close
                    event.preventDefault()
                } else if (hoveredCard.cardId !== null) {
                    setCardPopupShown(hoveredCard.cardId)
                    setCardPopupTransformed(false)
                    event.preventDefault()
                }
                break;
            case 't':
                if (hoveredCard.cardId !== null) {
                    playerDispatch(cardAction(TOGGLE_TRANSFORM_CARD, hoveredCard.cardId, hoveredCard.bfId === null))
                    event.preventDefault()
                }
                break;
            case 'f':
                if (hoveredCard.cardId !== null) {
                    playerDispatch(cardAction(TOGGLE_FACEDOWN_CARD, hoveredCard.cardId, hoveredCard.bfId === null))
                    event.preventDefault()
                }
                break;
            case 'C':
                tokenPopup()
                event.preventDefault()
                break;
            case 'c':
                if (hoveredCard.bfId !== null) {
                    counterPopup(hoveredCard.bfId)
                    event.preventDefault()
                }
                break;
            case 'a':
                drawArrow()
                event.preventDefault();
                break;
        }
    }

    const lines = []
    for (let i = 0; i < drawLines.length; i++) {
        if (i % 2 == 1) {
            lines.push(
                <LineTo from={`c${drawLines[i - 1]}`} to={`c${drawLines[i]}`}
                        borderColor={"gray"} borderStyle={"dashed"} borderWidth={4}
                        delay={100}/>
            )
        }
    }

    //tabIndex means it can receive focus which means it can receive keyboard events
    return userName
        ? (
            <div className="Game" onKeyPress={keyPress} tabIndex={0} style={{
                cursor: isDrawing ? "crosshair" : undefined
            }}>
                <Table/>
                <Hand/>
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