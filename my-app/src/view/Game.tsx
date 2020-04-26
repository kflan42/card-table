import React, { useEffect, useState } from 'react'

import './_style.css';
import Hand from './Hand';
import Table from './Table';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ClientState } from '../ClientState';
import { localStateLoaded } from '../Actions';
import CardPopup from './CardPopup';

const Game: React.FC = () => {

    const { gameId } = useParams()

    const userName = useSelector((state: ClientState) => state.playerPrefs.name)
    const cardUnderCursor = useSelector((state: ClientState) => state.cardUnderCursor)

    const [cardPopupShown, setCardPopupShown] = useState<number | null>(null)
    const [cardPopupTransformed, setCardPopupTransformed] = useState(false)

    const dispatch = useDispatch()

    useEffect(() => {
        // initial load effect only, prevents "too many re-renders error"
        if (userName)
            return
        const u = localStorage.getItem('userName')
        const c = localStorage.getItem('userColor')
        if (u && c) dispatch(localStateLoaded(u, c))
    }, [userName, dispatch]);

    const keyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        console.log(event)

        switch (event.key) {
            case 'v':
                if (cardPopupShown === cardUnderCursor) {
                    setCardPopupShown(null) // view again to close
                    event.preventDefault()
                } else if (cardUnderCursor !== null) {
                    setCardPopupShown(cardUnderCursor)
                    setCardPopupTransformed(false)
                    event.preventDefault()
                }
                break;
            case 't':
                setCardPopupTransformed(!cardPopupTransformed)
                event.preventDefault()
                break;
        }

    }

    /* eslint-disable jsx-a11y/accessible-emoji */
    //tabIndex means it can recieve focus which means it can receive keyboard events
    return userName
        ? (
            <div className="Game" onKeyPress={keyPress} tabIndex={0}>
                <span>🎲 Game {gameId} as {userName} </span>
                <Table />
                <Hand />
                {cardPopupShown !== null ? <CardPopup cardId={cardPopupShown} transformed={cardPopupTransformed} /> : undefined}
            </div>
        )
        : <div />
}

export default Game