
import React, { useEffect } from 'react'


import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import Card from './Card';
import { ItemTypes, DragCard } from './DnDUtils';
import { useDispatch } from 'react-redux';
import { MoveCard, MOVE_CARD } from '../Actions';
import { HAND } from '../ClientState';
import { getEmptyImage } from 'react-dnd-html5-backend';


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
    const dispatch = useDispatch()

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

    function moveCard(draggedCard: DragCard) {
        if (draggedCard.cardId !== cardId) {
            const cardMove: MoveCard = {
                ...draggedCard,
                type: MOVE_CARD,
                when: Date.now(),
                tgtZone: HAND,
                tgtOwner: owner,
                toIdx: handIdx,
            }
            dispatch(cardMove)
        }
    }

    const [, drop] = useDrop({
        accept: [ItemTypes.CARD, ItemTypes.BFCARD],
        canDrop: (item: DragCard, monitor: DropTargetMonitor) => {
            return item.srcOwner !== owner || item.srcZone !== HAND
        },
        hover(item: DragCard, monitor: DropTargetMonitor) {
            if (item.srcOwner === owner && item.srcZone === HAND) {
                moveCard(item) // re order hand on hover
            }
        },
        drop(item: DragCard, monitor: DropTargetMonitor) {
            moveCard(item); // allow cross zone moves on drop
            return {} // empty object says we handled it
        },
    })

    const opacity = isDragging ? 0 : 1

    return (
        <div ref={(node) => drag(drop(node))} style={{ opacity, margin:"0.25em" }}>
            <Card cardId={cardId} ></Card>
        </div>
    )
}

const MemoizeHandCard = React.memo(HandCard)
export default MemoizeHandCard