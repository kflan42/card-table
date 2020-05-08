import React, { useEffect, useState } from 'react'

import './_style.css';
import Hand from './Hand';
import Table from './Table';
import { useDispatch, useSelector } from 'react-redux';
import { ClientState, BattlefieldCard } from '../ClientState';
import {
    localStateLoaded,
    cardAction,
    TOGGLE_TRANSFORM_CARD,
    TOGGLE_FACEDOWN_CARD,
    setCardCounter,
    createTokenCopy,
    createTokenNew,
    setGame
} from '../Actions';
import CardPopup from './CardPopup';
import CustomDragLayer from './CustomDragLayer';
import { useConfirmation } from './ConfirmationService';
import { ConfirmationResult } from './ConfirmationDialog';
import { usePlayerDispatch } from '../PlayerDispatch';
import {createTestGame} from "../zzzState";
import {useParams} from "react-router-dom";

const Game: React.FC = () => {
    const userName = useSelector((state: ClientState) => state.playerPrefs.name)
    const cardUnderCursor = useSelector((state: ClientState) => state.cardUnderCursor)
    const bfCardUnderCursor = useSelector((state: ClientState) =>
        state.cardUnderCursor.bfId ? state.game.battlefieldCards[state.cardUnderCursor.bfId] : null)
    const cardPropsUnderCursor = useSelector((state: ClientState) =>
        state.cardUnderCursor.cardId ? state.game.cards[state.cardUnderCursor.cardId] : null)

    const [cardPopupShown, setCardPopupShown] = useState<number | null>(null)
    const [cardPopupTransformed, setCardPopupTransformed] = useState(false)

    const dispatch = useDispatch()
    const playerDispatch = usePlayerDispatch()
    const { gameId } = useParams()

    useEffect(() => {
        // initial load effect only, prevents "too many re-renders error"
        if (userName)
            return
        const u = localStorage.getItem('userName')
        const c = localStorage.getItem('userColor')
        if (u && c) dispatch(localStateLoaded(u, c))
        if (gameId === 'test') {
            dispatch(setGame(createTestGame()))
        }
    }, [userName, gameId, dispatch]);

    const confirmation = useConfirmation();

    const tokenPopup = () => {
        const choices = cardPropsUnderCursor ? ["Copy " + cardPropsUnderCursor.name] : []
        choices.push("New Token *")
        confirmation({
            choices: choices,
            catchOnCancel: true,
            title: "Create Token",
            description: ""
        }).then((s: ConfirmationResult) => {
            switch (s.choice.split(' ')[0]) {
                case "Copy":
                    playerDispatch(createTokenCopy(userName, cardUnderCursor.cardId as number));
                    break;
                case "New":
                    playerDispatch(createTokenNew(userName, s.s))
                    break;
            }
        })
            .catch(() => null);
    }

    const counterPopup = (bfCard: BattlefieldCard) => {
        confirmation({
            choices: ["+1/+1", "+1/+0", "+0/+1", "Create * _"],
            catchOnCancel: true,
            title: "Create Counter",
            description: ""
        })
            .then((s: ConfirmationResult) => {
                switch (s.choice) {
                    case "Create * _":
                        playerDispatch(setCardCounter(bfCard.bfId, s.s, s.n));
                        break;
                    default:
                        playerDispatch(setCardCounter(bfCard.bfId, s.choice, s.n));
                        return;
                }
            })
            .catch(() => null);
    }

    const keyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case 'v':
                if (cardPopupShown === cardUnderCursor.cardId) {
                    setCardPopupShown(null) // view again to close
                    event.preventDefault()
                } else if (cardUnderCursor !== null) {
                    setCardPopupShown(cardUnderCursor.cardId)
                    setCardPopupTransformed(false)
                    event.preventDefault()
                }
                break;
            case 't':
                if (cardUnderCursor.cardId !== null) {
                    playerDispatch(cardAction(TOGGLE_TRANSFORM_CARD, cardUnderCursor.cardId, bfCardUnderCursor === null))
                    event.preventDefault()
                }
                break;
            case 'f':
                if (cardUnderCursor.cardId !== null) {
                    playerDispatch(cardAction(TOGGLE_FACEDOWN_CARD, cardUnderCursor.cardId, bfCardUnderCursor === null))
                    event.preventDefault()
                }
                break;
            case 'C':
                    tokenPopup()
                    event.preventDefault()
                break;
            case 'c':
                if (bfCardUnderCursor !== null) {
                    counterPopup(bfCardUnderCursor)
                    event.preventDefault()
                }
                break;
        }
    }


    //tabIndex means it can recieve focus which means it can receive keyboard events
    return userName
        ? (
            <div className="Game" onKeyPress={keyPress} tabIndex={0}>
                <Table />
                <Hand />
                {cardPopupShown !== null ? <CardPopup cardId={cardPopupShown} transformed={cardPopupTransformed} /> : undefined}
                <CustomDragLayer />
            </div>
        )
        : <div />
}

export default Game