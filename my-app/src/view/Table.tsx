import React from 'react'

import './_style.css';
import Playmat from './Playmat';
import { useSelector } from 'react-redux';
import { ClientState } from '../ClientState';



const Table: React.FC = () => {

    const playersState = useSelector((state: ClientState) => {
        return state.game.players;
    });

    const mats = []
    const width = 1.0/Math.ceil(Object.keys(playersState).length/2) - 0.005 // - padding for scrollbar
    for (const player in playersState) {
        mats.push(<Playmat key={player} player={player} width={width} />)
    }

    return (
        <div className="Table" style={{flexDirection: mats.length > 2 ? "row": "column"}}>
            {mats}
        </div>
    )
}

export default Table