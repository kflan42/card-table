import React, {useEffect, useState} from 'react'

import './_style.css';
import Hand from './Hand';
import Table from './Table';
import {useDispatch, useSelector} from 'react-redux';
import {ClientState, index_game} from '../ClientState';
import {
    cardAction,
    createTokenCopy,
    createTokenNew,
    localStateLoaded,
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
import CardDB from "../CardDB";

const Game: React.FC = () => {
    const userName = useSelector((state: ClientState) => state.playerPrefs.name)
    const hoveredCard = useSelector((state: ClientState) => state.hoveredCard)
    const cardUnderCursor = useSelector((state: ClientState) =>
        state.hoveredCard.cardId ? state.game.cards[state.hoveredCard.cardId] : null)

    const [cardPopupShown, setCardPopupShown] = useState<number | null>(null)
    const [cardPopupTransformed, setCardPopupTransformed] = useState(false)

    const dispatch = useDispatch()
    const playerDispatch = usePlayerDispatch()
    const {gameId} = useParams()

    useEffect(() => {
        // initial load effect only, prevents "too many re-renders error"
        if (userName)
            return
        const u = localStorage.getItem('userName')
        const c = localStorage.getItem('userColor')
        if (u && c) dispatch(localStateLoaded(u, c))

        async function gameLoaded(r: Response) {
            await CardDB.loadCards(gameId as string)
            // now that cards are loaded, load the game
            const data = r.json()
            const game: GameT = await data
            dispatch(setGame(index_game(game)))
        }

        const gameUrl = gameId === 'test' ? 'testGame.json' : 'http://localhost:3000/table/' + gameId
        // const headers = { Accept: "application/json" }
        // const { data, error, isPending, run } = useFetch<Game>("testGame.json", {headers} )
        fetch(gameUrl).then(
            gameLoaded
        )
    }, [userName, gameId, dispatch]);

    const confirmation = useConfirmation();

    const tokenPopup = () => {
        const choices = cardUnderCursor ? ["Copy " + CardDB.getCard(cardUnderCursor.sf_id).name] : []
        choices.push("New Token *")
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
                    // todo account for set, error-handle, auto complete
                    playerDispatch(createTokenNew(userName, CardDB.findCardNow(s.s).sf_id))
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
        }
    }


    //tabIndex means it can recieve focus which means it can receive keyboard events
    return userName
        ? (
            <div className="Game" onKeyPress={keyPress} tabIndex={0}>
                <Table/>
                <Hand/>
                {cardPopupShown !== null ?
                    <CardPopup cardId={cardPopupShown} transformed={cardPopupTransformed}/> : undefined}
                <CustomDragLayer/>
            </div>
        )
        : <div/>
}

export default Game