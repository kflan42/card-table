import React from 'react'

import './_style.css';
import { useConfirmation } from './ConfirmationService';
import { SET_PLAYER_COUNTER } from '../Actions';
import { ConfirmationResult } from './ConfirmationDialog';
import { usePlayerActions } from '../PlayerDispatch';

interface PlayerCounterP {
    player: string,
    kind: string,
    value: number
}


const PlayerCounter: React.FC<PlayerCounterP> = ({ player, kind, value }) => {
    const label = kind === "Life" ? "❤️" : kind;

    const { action: playerDispatch, baseAction } = usePlayerActions()

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
                var newValue = s.n;
                switch (s.choice) {
                    case "▲":
                        newValue = value + 1;
                        break;
                    case "Set to _":
                        newValue = s.n;
                        break;
                    case "▼":
                        newValue = value - 1;
                        break;
                }
                playerDispatch({
                    ...baseAction(),
                    kind: SET_PLAYER_COUNTER,
                    counter_changes: [{
                        player,
                        card_id: null,
                        name: kind,
                        value: newValue
                    }]
                })
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