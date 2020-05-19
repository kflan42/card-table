
import React, {useEffect} from 'react'


import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import Card from './Card';
import { ItemTypes, DragCard } from './DnDUtils';
import { MOVE_CARD } from '../Actions';
import { HAND } from '../ClientState';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { usePlayerDispatch } from '../PlayerDispatch';
import {useDispatch} from "react-redux";


interface HandCardProps {
    cardId: number,
    handIdx: number,
    owner: string
}


const HandCard: React.FC<HandCardProps> = ({
    cardId,
    handIdx,
    owner
}) => {
    const playerDispatch = usePlayerDispatch().action

    const dragCard: DragCard = {
        type: ItemTypes.CARD, cardId: cardId, srcZone: HAND, srcOwner: owner
    }

    const [{ isDragging }, drag, preview] = useDrag({
        item: dragCard,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    })

    useEffect(() => {
        // hide default html drag preview since we have a custom one based on the card props
        preview(getEmptyImage(), { captureDraggingState: true })
    }, [preview])

    const dispatch = useDispatch()

    function moveCard(draggedCard: DragCard, dueToHover: boolean) {
        if (draggedCard.cardId !== cardId || !dueToHover) {
            const cardMove = {
                ...draggedCard,
                type: MOVE_CARD,
                tgtZone: HAND,
                tgtOwner: owner,
                toIdx: handIdx,
            }
            if (dueToHover) {
                // avoid spamming server as hover fires every render which is faster than server dispatching
                dispatch({...cardMove, who: owner, when: Date.now()})
            } else {
                playerDispatch(cardMove)
            }
        }
    }

    const [, drop] = useDrop({
        accept: [ItemTypes.CARD, ItemTypes.BFCARD],
        hover(item: DragCard, monitor: DropTargetMonitor) {
            if (item.srcOwner === owner && item.srcZone === HAND) {
                moveCard(item, true) // re order hand on hover
            }
        },
        drop(item: DragCard, monitor: DropTargetMonitor) {
            moveCard(item, false); // allow cross zone moves on drop
            return {} // empty object says we handled it
        },
    })

    const opacity = isDragging ? 0 : 1

    return (
        <div ref={(node) => drag(drop(node))} style={{ opacity, margin:"0.25em" }}>
            <Card cardId={cardId} imageSize={"normal"} ></Card>
        </div>
    )
}

const MemoizeHandCard = React.memo(HandCard)
export default MemoizeHandCard