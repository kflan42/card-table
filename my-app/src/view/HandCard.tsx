
import React, { useRef } from 'react'


import { ConnectDragSource, ConnectDropTarget, DropTarget, DropTargetMonitor, DragSource, DragSourceMonitor } from 'react-dnd';
import Card, { CardProps } from './Card';
import { ItemTypes } from './DnDUtils';


interface HandCardProps {
    cardProps: CardProps,
    moveCard: (id: number, to: number) => void,
    findCard: (id: number) => number | undefined

    connectDragSource: ConnectDragSource
    connectDropTarget: ConnectDropTarget
    isDragging: boolean
}


const HandCard: React.FC<HandCardProps> = ({
    cardProps,
    isDragging,
    connectDragSource,
    connectDropTarget,
}) => {
    const opacity = isDragging ? 0 : 1
    const ref = useRef(null)

    connectDragSource(ref)
    connectDropTarget(ref)

    return (
        <div ref={ref} style={{ opacity }}>
            <Card cardId={cardProps.cardId} borderStyle={cardProps.borderStyle} ></Card>
        </div>
    )
}

export default DropTarget(
    ItemTypes.CARD,
    {
        canDrop: () => false,
        hover(props: HandCardProps, monitor: DropTargetMonitor) {
            const { id: draggedId } = monitor.getItem()
            const { cardId: overId } = props.cardProps

            if (draggedId !== overId) {
                const overIndex = props.findCard(overId)
                if (overIndex !== undefined)
                    props.moveCard(draggedId, overIndex)
            }
        },
    },
    (connect) => ({
        connectDropTarget: connect.dropTarget(),
    }),
)(
    DragSource(
        ItemTypes.CARD,
        {
            beginDrag: (props: HandCardProps) => ({
                id: props.cardProps.cardId,
                originalIndex: props.findCard(props.cardProps.cardId),
            }),
            endDrag(props: HandCardProps, monitor: DragSourceMonitor) {
                const { id: droppedId, originalIndex } = monitor.getItem()
                const didDrop = monitor.didDrop()
                if (!didDrop) {
                    props.moveCard(droppedId, originalIndex)
                }
            },
        },
        (connect, monitor) => ({
            connectDragSource: connect.dragSource(),
            isDragging: monitor.isDragging(),
        }),
    )(HandCard),
)