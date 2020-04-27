import React from 'react'

import './_style.css';
import { ClientState, HAND } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { getZone } from '../zzzState';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import MemoizeHandCard from './HandCard';
import { ItemTypes, DragCard } from './DnDUtils';
import { MoveCard, MOVE_CARD } from '../Actions';

export interface HandProps {
}

const Hand: React.FC<HandProps> = () => {

    const zoneState = useSelector((state: ClientState) => {
        return getZone(state.game, state.playerPrefs.name, HAND)
    })

    const dispatch = useDispatch()

    const [, drop] = useDrop({
        accept: [ItemTypes.CARD, ItemTypes.BFCARD],
        canDrop: (item: DragCard, monitor: DropTargetMonitor) => {
            return item.srcOwner !== zoneState?.owner || item.srcZone !== HAND
        },
        drop(item: DragCard, monitor: DropTargetMonitor) {
            if (monitor.didDrop()) {
                return; // don't duplicate HandCard's efforts
            }
            // allow cross zone moves on drop
            const cardMove: MoveCard = {
                ...item,
                type: MOVE_CARD,
                when: Date.now(),
                tgtZone: HAND,
                tgtOwner: zoneState?.owner,
            }
            dispatch(cardMove)
        },
    })


    const listItems = []
    if (zoneState) {
        let i = 0;
        for (const cardId of zoneState.cards) {
            listItems.push(
                <MemoizeHandCard key={cardId} cardId={cardId} handIdx={i++} owner={zoneState.owner} />
            )
        }
    }

    return (
        <div ref={drop} className="Hand">
            <span style={{ writingMode: "vertical-lr", textOrientation: "upright", minHeight: "13em" }}>Hand</span>
            {listItems}
        </div>
    )
}

export default Hand