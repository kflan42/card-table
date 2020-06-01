import React from 'react'

import './_style.css';
import Battlefield from './Battlefield';
import PlayerBox from './PlayerBox';
import {useSelector} from "react-redux";
import {ClientState} from "../ClientState";

interface PlaymatP {
    player: string,
    width: number
}

const Playmat: React.FC<PlaymatP> = ({player, width}) => {

    const playerColor = useSelector((state: ClientState) => {
        return state.game.players[player].color;
    });

    return (
        <div className="Playmat" style={{
            width: width * 100 + "%",
            borderColor: playerColor
        }}>
            <PlayerBox player={player} />
            <Battlefield player={player} />
        </div>
    )
}

const MemoizedPlaymat = React.memo(Playmat)
export default MemoizedPlaymat