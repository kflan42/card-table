import React from 'react'

import './_style.css';
import {useConfirmation} from './ConfirmationService';
import {setPlayerCounter} from '../Actions';
import {ConfirmationResult} from './ConfirmationDialog';
import {usePlayerDispatch} from '../PlayerDispatch';

interface PlayerCounterP {
    player: string,
    kind: string,
    value: number
}


const PlayerCounter: React.FC<PlayerCounterP> = ({player, kind, value}) => {
    const label = kind === "Life" ? "❤️" : kind;

    const playerDispatch = usePlayerDispatch().action

    const confirmation = useConfirmation();

    function counterClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        confirmation({
            choices: ["▲", "Set to _", "▼"],
            catchOnCancel: true,
            title: `Adjust ${label} ${value}`,
            description: "",
            location: { x: e.clientX, y: e.clientY },
            initialNumber: value
        })
            .then((s: ConfirmationResult) => {
                switch (s.choice) {
                    case "▲":
                        playerDispatch(setPlayerCounter(player, kind, value + 1));
                        break;
                    case "Set to _":
                        playerDispatch(setPlayerCounter(player, kind, s.n));
                        break;
                    case "▼":
                        playerDispatch(setPlayerCounter(player, kind, value - 1));
                        break;
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