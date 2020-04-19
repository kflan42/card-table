import React from 'react'

import './myStyle.css';
import Battlefield from './Battlefield';
import PlayerBox from './PlayerBox';

interface PlaymatP {
    player: string
}

const Playmat: React.FC<PlaymatP> = (props) => {
    
    return (
        <div className="Playmat">
            <Battlefield/>
            {/* todo put cards in zones on Playmat*/}
            <PlayerBox player={props.player}/>
        </div>
    )
}

export default Playmat