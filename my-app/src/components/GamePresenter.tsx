import React, { useState, useEffect } from 'react'

import './zeStyle.css';
import Hand from './Hand';
import { useParams } from 'react-router-dom';
import { Card } from '../ClientState';
import TablePresenter from './TablePresenter';
import { useDispatch } from 'react-redux';
import { load } from '../Actions';



const GamePresenter: React.FC = () => {

    const { gameId } = useParams()

    const [userName, setUserName] = useState('')

    const dispatch = useDispatch()

    useEffect(() => {
        // initial load effect only
        if (userName !== '')
            return

        const u = localStorage.getItem('userName')
        if (u) setUserName(u);

        // todo move this out to a communication file
        // in that file, consider using https://react-redux.js.org/api/batch#batch when many actions come in from server
        // server could just be list of actions, tho then on re-join need to apply them all to initial state
        // optimize by doing a game snapshot occasionally from client to server
        // server doesn't need a "reducer" this way
        function loadGameStateFromServer() {
            console.log("loading state from server")
            //fetch("https://api.example.com/items")
            //    .then(res => res.json())
            // new Promise<{ [index: number]: Card }>(result => result({ 1: { id: 1, tapped: false } }))
            //     .then(
            //         (result) => {
            //             dispatch(load(result))
            //         },
            //         // Note: it's important to handle errors here
            //         // instead of a catch() block so that we don't swallow
            //         // exceptions from actual bugs in components.
            //         (error) => {
            //             console.error(error)
            //         }
            //     )
        }

        loadGameStateFromServer();
    }, [ dispatch, userName]);



    return (
        <>
            
                <div className="Game">
                    <h1>Game {gameId} as {userName} </h1>
                    <TablePresenter></TablePresenter>
                    <Hand></Hand>
                </div>
        </>
    )
}

export default GamePresenter