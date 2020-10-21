import React from 'react'

import './_style.css';
import Playmat from './Playmat';
import { useSelector } from 'react-redux';
import { ClientState } from '../ClientState';



const Table: React.FC = () => {

    const playersState = useSelector((state: ClientState) => {
        return state.game.players;
    });

    const hiddenPlayers = useSelector((state: ClientState) => {
        return state.hiddenPlaymats;
    });

    const shownPlayers = Object.keys(playersState).filter(p => !hiddenPlayers.includes(p))
    const row1: JSX.Element[] = []
    const row2: JSX.Element[] = []
    const playersPerRow = Math.ceil(shownPlayers.length/2)
    const width = (1.0 - 0.008 * playersPerRow) / playersPerRow // margins and borders
    for (const player of shownPlayers) {
        const row = row1.length < playersPerRow ? row1 : row2
        row.push(<Playmat key={player} player={player} width={width} />)
    }


    return (
        <div className="Table">
            <div className="TableRow">{row1}</div>
            <div className="TableRow" style={{flexDirection:"row-reverse"}}>{row2}</div>
        </div>
    )
}

export default Table