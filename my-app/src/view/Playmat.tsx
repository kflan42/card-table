import React from 'react'

import './_style.css';
import Battlefield from './Battlefield';
import PlayerBox from './PlayerBox';

interface PlaymatP {
    player: string,
    width: number
}

const Playmat: React.FC<PlaymatP> = (props) => {

    return (
        <div className="Playmat" style={{ width: props.width * 100 + "%" }}>
            <PlayerBox player={props.player} />
            <Battlefield player={props.player} />
        </div>
    )
}

const MemoizedPlaymat = React.memo(Playmat)
export default MemoizedPlaymat