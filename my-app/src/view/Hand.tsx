import React, { useState, useEffect } from 'react'

import './_style.css';
import Card from './Card';
import { ClientState } from '../ClientState';
import { useSelector } from 'react-redux';
import { getZone } from '../zzzState';


const Hand: React.FC = () => {

    const zoneState = useSelector((state: ClientState) => {
        if (state.playerName) {
            return getZone(state.game, state.playerName, "Hand")
        } else {
            return undefined
        }
    })

    const listItems = []
    if (zoneState) {
        for (const cardId of zoneState.cards) {
            listItems.push(<Card key={cardId} cardId={cardId} />)
        }
    }

    return (
        <div className="Hand">
            {listItems}
        </div>
    )
}

export default Hand