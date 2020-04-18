import React from 'react'

import './myStyle.css';
import Hand from './Hand';
import Table from './Table';



const Game: React.FC = () => {

    const gameId = "1"
    const userName = "alice"
    
    return (
        <div className="Game">
            
            <h1>	
&#127922; {/*die*/} Game {gameId} as {userName} </h1>
            <Table></Table>
            <Hand></Hand>
        </div>
    )
}

export default Game