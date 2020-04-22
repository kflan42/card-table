import React, { useState, useEffect } from 'react'

import './_style.css';
import Hand from './Hand';
import Table from './Table';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ClientState } from '../ClientState';

const Game: React.FC = () => {

    const { gameId } = useParams()

    const userName = useSelector((state: ClientState) => state.playerName)

    const dispatch = useDispatch()

    useEffect(() => {
        // initial load effect only, prevents "too many re-renders error"
        if (userName)
            return
        const u = localStorage.getItem('userName')
        if (u) dispatch({ type: "set name", value: u })
    }, [userName]);

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