import React, { useCallback } from 'react'

import './_style.css';
import { ClientState, HAND } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { getZone } from '../zzzState';
import { useDrop } from 'react-dnd';
import { reorderHand, MoveCard, MOVE_CARD } from '../Actions';
import HandCard from './HandCard';
import { ItemTypes } from './DnDUtils';

export interface HandProps {
}

const Hand: React.FC<HandProps> = () => {

    const zoneState = useSelector((state: ClientState) => {
        if (state.playerPrefs.name) {
            return getZone(state.game, state.playerPrefs.name, HAND)
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

            const cardMove: MoveCard = {
                type: MOVE_CARD,
                when: Date.now(),
                cardId: cardId,
                srcZone: HAND,
                srcOwner: zoneState.owner,
                tgtZone: HAND,
                tgtOwner: zoneState.owner,
                toIdx: toIndex
            }
            //dispatcher(cardMove)
            dispatcher(reorderHand(zoneState.owner, cardId, fromIndex, toIndex))
        },
        [zoneState, dispatcher, findCard],
    )


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

    const [, drop] = useDrop({ accept: ItemTypes.CARD })

    return (
        <div ref={drop} className="Hand">
            {listItems}
        </div>
    )
}

export default Hand