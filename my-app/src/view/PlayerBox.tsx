import React from 'react'

import './_style.css';
import PlayerCounter from './PlayerCounter';
import CardStack from './CardStack';
import { EXILE, COMMAND_ZONE, GRAVEYARD, LIBRARY, HAND, ClientState } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirmation } from './ConfirmationService';
import { setPlayerCounter } from '../Actions';
import { ConfirmationResult } from './ConfirmationDialog';

interface PlayerBoxP {
    player: string
}

const PlayerBox: React.FC<PlayerBoxP> = ({ player }) => {

    const playerState = useSelector((state: ClientState) => {
        return state.game.players[player];
    });

    const counters = []
    for (const kind in playerState.counters) {
        counters.push(<PlayerCounter key={kind} player={player} kind={kind} />)
    }

    const dispatch = useDispatch()
    const confirmation = useConfirmation();

    const addCounter = () => {
        confirmation({
            choices: ["Create Name * Count _"],
            catchOnCancel: true,
            title: "Create Player Counter",
            description: ""
        })
            .then((s: ConfirmationResult) => {
                switch (s.choice) {
                    case "Create Name * Count _":
                        dispatch(setPlayerCounter(player, s.s, s.n));
                        break;
                }
            })
            .catch(() => null);
    }

    return (
        /* eslint-disable jsx-a11y/accessible-emoji */
        <div className="PlayerBox">
            <div style={{
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: "6em", cursor: "default"
            }}>
                <strong>{player}</strong>
            </div>
            <CardStack name={HAND} owner={player} icon="✋" />
            <CardStack name={LIBRARY} owner={player} icon="📚" />
            <CardStack name={GRAVEYARD} owner={player} icon="🗑️" />
            <CardStack name={EXILE} owner={player} icon="📒" />
            <CardStack name={COMMAND_ZONE} owner={player} icon="👑" />
            {counters}
            <div className=" buttontooltip">
                <div className="DivButton" onClick={addCounter}>➕</div>
                <span className="buttontooltiptext">Add Counter</span>
            </div>
        </div>
        /* todo popup dialog for adding a counter (player/card), delete counters at zero */
    )
}

export default PlayerBox