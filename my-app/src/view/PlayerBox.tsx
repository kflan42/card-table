import React from 'react'

import './myStyle.css';
import PlayerCounter from './PlayerCounter';

interface PlayerBoxP {
    player: string
}

const PlayerBox: React.FC<PlayerBoxP> = (props) => {

    // todo popup windows for card zones
    return (
        /* eslint-disable jsx-a11y/accessible-emoji */
        <div className="PlayerBox">
            <div>{props.player} </div>
            <div className="tooltip">✋{/*hand*/} 7
                <span className="tooltiptext">Hand</span>
            </div>
            <div className="tooltip">📚{/*library*/} 82
                <span className="tooltiptext">Library</span>
            </div>
            <div className="tooltip">🗑️{/*graveyard*/} 10
                <span className="tooltiptext">Graveyard</span>
            </div>
            <div className="tooltip">📒{/*sideboard*/} 0
                <span className="tooltiptext">Sideboard (Exile)</span>
            </div>
            <div className="tooltip">👑{/*hand*/} 1
                <span className="tooltiptext">Command Zone</span>
            </div>
            <PlayerCounter kind="Life" />
            <div className="tooltip">➕
                <span className="tooltiptext">Add Counter</span>
            </div>
        </div>
    )
}

export default PlayerBox