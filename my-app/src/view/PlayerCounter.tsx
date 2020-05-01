import React from 'react'

import './_style.css';
import { useConfirmation } from './ConfirmationService';
import { useDispatch, useSelector } from 'react-redux';
import { setPlayerCounter } from '../Actions';
import { ClientState } from '../ClientState';

interface PlayerCounterP {
    player: string,
    kind: string
}


const PlayerCounter: React.FC<PlayerCounterP> = ({ player, kind }) => {

    const label = kind === "Life" ? "❤️" : kind;
    const value = useSelector((state: ClientState) => {
        return state.game.players[player].counters[kind];
    });

    // function up() {
    //     console.log(props.kind + " up")
    // }

    // function down() {
    //     console.log(props.kind + " down")
    // }

    const dispatch = useDispatch()

    const confirmation = useConfirmation();

    function counterClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        confirmation({
            choices: ["▲", "Set to _", "▼"],
            catchOnCancel: true,
            title: `Adjust ${label} ${value}`,
            description: "",
            location: { x: e.clientX, y: e.clientY }
        })
            .then((s: [string, number?]) => {
                switch (s[0]) {
                    case "▲":
                        dispatch(setPlayerCounter(player, kind, value + 1));
                        break;
                    case "Set to _":
                        const n = s[1] as number
                        dispatch(setPlayerCounter(player, kind, n));
                        break;
                    case "▼":
                        dispatch(setPlayerCounter(player, kind, value - 1));
                        break;
                    case "Cancel":
                        return;
                }
            })
            .catch(() => null);
    }

    return (
        <div className="buttontooltip">
            <div className="DivButton" onClick={e => counterClick(e)} >
                {label} {value}
                <span className="buttontooltiptext">{kind}</span>
            </div>

            {/* <span className="DivButton" onClick={() => up()}>▲</span>
            <span className="DivButton" onClick={() => down()}>▼</span> */}
        </div>
    )
}

export default PlayerCounter