import React from 'react'

import './_style.css';
import PlayerCounter from './PlayerCounter';
import CardStack from './CardStack';
import { EXILE, COMMAND_ZONE, GRAVEYARD, LIBRARY, HAND } from '../ClientState';

interface PlayerBoxP {
    player: string
}

const PlayerBox: React.FC<PlayerBoxP> = (props) => {

    // TODO popup windows for card zones
    return (
        /* eslint-disable jsx-a11y/accessible-emoji */
        <div className="PlayerBox">
            <div style={{
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: "60pt", cursor: "default"
            }}>
                <strong>{props.player}</strong>
            </div>
            <CardStack name={HAND} icon="✋" />
            <CardStack name={LIBRARY} icon="📚" />
            <CardStack name={GRAVEYARD} icon="🗑️" />
            <CardStack name={EXILE} icon="📒" />
            <CardStack name={COMMAND_ZONE} icon="👑" />
            <PlayerCounter kind="Life" />
            <div className="TextButton buttontooltip">➕
                <span className="buttontooltiptext">Add Counter</span>
            </div>
        </div>
        /* todo popup dialog for adding a counter (player/card), delete counters at zero */
    )
}

export default PlayerBox