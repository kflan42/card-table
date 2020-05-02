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
    for (const player in playersState) {
        mats.push(<Playmat key={player} player={player} />)
    }

    return (
        <div className="Table">
            {mats}
        </div>
    )
}

export default Table