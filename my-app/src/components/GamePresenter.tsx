import React, { useState, useEffect } from 'react'

import './zeStyle.css';
import Hand from './Hand';
import { useParams } from 'react-router-dom';
import { Card } from '../Game';
import TableContainer from './TableContainer';

interface GPP {
    onNewCards: (arg0: any)=>void
}

const GamePresenter: React.FC<GPP> = ({onNewCards}) => {

    const { gameId } = useParams()

    const [userName, setUserName] = useState('')

    useEffect(() => {
        // initial load effect only
        if (userName !== '')
            return

        const u = localStorage.getItem('userName')
        if (u) setUserName(u);

        function loadGameStateFromServer() {
            console.log("loading state from server")
            //fetch("https://api.example.com/items")
            //    .then(res => res.json())
            new Promise<{ [index: number]: Card }>(result => result({ 1: { id: 1, tapped: false } }))
                .then(
                    (result) => {
                        onNewCards(result)
                    },
                    // Note: it's important to handle errors here
                    // instead of a catch() block so that we don't swallow
                    // exceptions from actual bugs in components.
                    (error) => {
                        console.error(error)
                    }
                )
        }

        loadGameStateFromServer();
    }, [onNewCards, userName]);



    return (
        <>
            
                <div className="Game">
                    <h1>Game {gameId} as {userName} </h1>
                    {/* <Table cards={store.getState().cards}></Table> */}
                    <TableContainer></TableContainer>
                    <Hand></Hand>
                </div>
        </>
    )
}

export default GamePresenter