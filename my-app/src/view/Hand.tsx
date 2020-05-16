import React from 'react'

import './_style.css';
import {ClientState, HAND} from '../ClientState';
import {useSelector} from 'react-redux';
import {useDrop, DropTargetMonitor} from 'react-dnd';
import MemoizeHandCard from './HandCard';
import {ItemTypes, DragCard} from './DnDUtils';
import {MOVE_CARD} from '../Actions';
import {usePlayerDispatch} from '../PlayerDispatch';

export interface HandProps {
}

const Hand: React.FC<HandProps> = () => {

    const zoneState = useSelector((state: ClientState) => {
        return state.game.zones[`${state.playerPrefs.name}-${HAND}`]
    })

    const playerDispatch = usePlayerDispatch().action

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
            const cardMove = {
                ...item,
                type: MOVE_CARD,
                tgtZone: HAND,
                tgtOwner: zoneState?.owner,
            }
            playerDispatch(cardMove)
        },
    })


    const listItems = []
    if (zoneState) {
        let i = 0;
        for (const cardId of zoneState.cards) {
            listItems.push(
                <MemoizeHandCard key={cardId} cardId={cardId} handIdx={i++} owner={zoneState.owner}/>
            )
        }
    }

    return (
        <div ref={drop} className="Hand">
            <span
                style={{userSelect: "none", writingMode: "vertical-lr", textOrientation: "upright", minHeight: "13em"}}>
                Hand
            </span>
            {listItems}
        </div>
    )
}

export default Hand