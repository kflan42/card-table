import React, { useCallback, useRef } from 'react'

import './_style.css';
import { ClientState } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { getZone } from '../zzzState';
import { DropTarget, ConnectDropTarget } from 'react-dnd';
import { CARD, reorderHand } from '../Actions';
import HandCard from './HandCard';

export interface HandProps {
    connectDropTarget: ConnectDropTarget
}

const Hand: React.FC<HandProps> = ({ connectDropTarget }) => {
    const ref = useRef(null)


    const zoneState = useSelector((state: ClientState) => {
        if (state.playerPrefs.name) {
            return getZone(state.game, state.playerPrefs.name, "Hand")
        } else {
            return undefined
        }
    })

    const dispatcher = useDispatch()

    const findCard = useCallback(
        (cardId: number) => {
            if (!zoneState) return
            return zoneState.cards.indexOf(cardId)
        },
        [zoneState],
    )

    const moveCard = useCallback(
        (cardId: number, toIndex: number) => {
            const fromIndex = findCard(cardId)
            if (zoneState === undefined || fromIndex === undefined) return
            dispatcher(reorderHand(zoneState.owner, cardId, fromIndex, toIndex))
        },
        [zoneState, dispatcher, findCard],
    )

    connectDropTarget(ref)



    const listItems = []
    if (zoneState) {
        for (const cardId of zoneState.cards) {
            const cardProps = {
                cardId: cardId,
                borderStyle: "0.15em solid"
            }
            listItems.push(
                <HandCard key={cardId} cardProps={cardProps} moveCard={moveCard} findCard={findCard} />
            )
        }
    }

    return (
        <div ref={ref} className="Hand">
            {listItems}
        </div>
    )
}

export default DropTarget(CARD, {}, (connect) => ({
    connectDropTarget: connect.dropTarget(),
}))(Hand)