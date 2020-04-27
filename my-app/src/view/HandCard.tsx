
import React from 'react'


import {  DropTargetMonitor, useDrag, useDrop, DragObjectWithType } from 'react-dnd';
import Card, { CardProps } from './Card';
import { ItemTypes } from './DnDUtils';


interface HandCardProps {
    cardProps: CardProps,
    moveCard: (id: number, to: number) => void,
    findCard: (id: number) => number | undefined
}


const HandCard: React.FC<HandCardProps> = ({
    cardProps,
    moveCard,
    findCard
}) => {

    const originalIndex = findCard(cardProps.cardId)
    const [{ isDragging }, drag] = useDrag({
        item: { type: ItemTypes.CARD, id: cardProps.cardId, originalIndex },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        end: (dropResult, monitor) => {
            const { id: droppedId, originalIndex } = monitor.getItem()
            const didDrop = monitor.didDrop()
            if (!didDrop) {
                moveCard(droppedId, originalIndex)
            }
        },
    })

    const [, drop] = useDrop({
        accept: ItemTypes.CARD,
        canDrop: () => false,
        hover(item: DragObjectWithType, monitor: DropTargetMonitor) {
            const { id: draggedId } = monitor.getItem()
            const { cardId: overId } = cardProps

            if (draggedId !== overId) {
                const overIndex = findCard(overId)
                if (overIndex !== undefined)
                    moveCard(draggedId, overIndex)
            }
        },
    })

    const opacity = isDragging ? 0 : 1

    return (
        <div ref={(node) => drag(drop(node))} style={{ opacity }}>
            <Card cardId={cardProps.cardId} borderStyle={cardProps.borderStyle} ></Card>
        </div>
    )
}

export default HandCard