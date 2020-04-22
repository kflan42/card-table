import React from 'react'

import './_style.css';
import PlayerCounter from './PlayerCounter';
import CardStack from './CardStack';

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
            <CardStack name="Hand" icon="✋" />
            <CardStack name="Library" icon="📚" />
            <CardStack name="Graveyard" icon="🗑️" />
            <CardStack name="Sideboard (Exile)" icon="📒" />
            <CardStack name="Command Zone" icon="👑" />
            <PlayerCounter kind="Life" />
            <div className="TextButton buttontooltip">➕
                <span className="buttontooltiptext">Add Counter</span>
            </div>
        </div>
        /* todo popup dialog for adding a counter (player/card), delete counters at zero */
    )
}

export default PlayerBox