import React from 'react'

import './_style.css';
import Battlefield from './Battlefield';
import PlayerBox from './PlayerBox';

interface PlaymatP {
    player: string
}

const Playmat: React.FC<PlaymatP> = (props) => {
    
    return (
        <div className="Playmat">
            <PlayerBox player={props.player}/>
            <Battlefield player={props.player}/>
        </div>
    )
}

const MemoizedPlaymat = React.memo(Playmat)
export default MemoizedPlaymat