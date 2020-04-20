import React from 'react'

import './_style.css';
import Hand from './Hand';
import Table from './Table';
import { useParams } from 'react-router-dom';



const Game: React.FC = () => {

    const { gameId } = useParams()
    const userName = "alice"
    
    /* eslint-disable jsx-a11y/accessible-emoji */
    return (
        <div className="Game">
            <span>🎲 Game {gameId} as {userName} </span>
            <Table></Table>
            <Hand></Hand>
        </div>
    )
}

export default Game