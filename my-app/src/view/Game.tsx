import React, { useEffect } from 'react'

import './_style.css';
import Hand from './Hand';
import Table from './Table';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ClientState } from '../ClientState';
import { localStateLoaded } from '../Actions';

const Game: React.FC = () => {

    const { gameId } = useParams()

    const userName = useSelector((state: ClientState) => state.playerPrefs.name)

    const dispatch = useDispatch()

    useEffect(() => {
        // initial load effect only, prevents "too many re-renders error"
        if (userName)
            return
        const u = localStorage.getItem('userName')
        const c = localStorage.getItem('userColor')
        if (u && c) dispatch(localStateLoaded(u, c))
    }, [userName, dispatch]);

    /* eslint-disable jsx-a11y/accessible-emoji */
    return userName
        ? (
            <div className="Game">
                <span>🎲 Game {gameId} as {userName} </span>
                <Table></Table>
                <Hand></Hand>
            </div>
        )
        : <div />
}

export default Game