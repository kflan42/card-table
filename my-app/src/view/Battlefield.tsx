import React from 'react'

import './_style.css';
import { useSelector } from 'react-redux';
import { ClientState } from '../ClientState';
import MemoizedBFCard from './BFCard';

interface BFP {
    player: string
}

const Battlefield: React.FC<BFP> = (props) => {

    const zoneState = useSelector((state: ClientState) => {
        return state.game.battlefields[props.player]
    })

    const listItems = []
    if (zoneState) {
        for (const bfId of zoneState.battlefieldCards) {
            listItems.push(<MemoizedBFCard key={bfId} bfId={bfId} />)
        }
    }

    return (
        <div className="Battlefield">
            {listItems}
        </div>
    )
}

export default Battlefield