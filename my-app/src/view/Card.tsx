import React, { useState, useEffect, useRef } from 'react'

import './_style.css';
import CardDB from '../CardDB';
import { CardData } from '../CardDB';
import { ClientState } from '../ClientState';
import { useSelector } from 'react-redux';
import { ConnectDragSource, ConnectDropTarget, DropTarget, DropTargetMonitor, DragSource, DragSourceMonitor } from 'react-dnd';
import { CARD } from '../Actions';

interface CardProps {
    cardId: number,
    moveCard: (id: number, to: number) => void,
    findCard: (id: number) => number | undefined
    height?: number,
    border?: string

    connectDragSource: ConnectDragSource
    connectDropTarget: ConnectDropTarget
    isDragging: boolean
}

const Card: React.FC<CardProps> = ({
    cardId,
    height,
    border,
    isDragging,
    connectDragSource,
    connectDropTarget,
}) => {
    const opacity = isDragging ? 0 : 1
    const ref = useRef(null)

    connectDragSource(ref)
    connectDropTarget(ref)

    const cardState = useSelector((state: ClientState) => state.game.cards[cardId])

    // small is 10.8k (memory cache after 1st). fuzzy text, hard to read
    // normal is 75.7k (memory cache after 1st). readable

    const [isLoading, setIsLoading] = useState(false)
    const [cardData, setData] = useState<CardData>()

    // TODO move card db load to ClientState
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)
            const response = await CardDB.getCard(cardState.name)
            setData(response)
            setIsLoading(false)
        }
        fetchData()
    }, [cardState.name])


    const front = () => {
        if (cardData) {
            return cardData.face_small ? cardData.face_small :
                cardData.faces_small ? cardData.faces_small[cardState.name] :
                    "react_logo_skewed.png" // not found placeholder
        }
        else
            return "react_logo_skewed.png" // loading placeholder
    }

    return (
        <div ref={ref} className={"Card cardtooltip"}
            style={{
                backgroundImage: `url("${front()}")`,
                minHeight: height ? `${height}em` : undefined,
                border: border,
                opacity
            }}
        >
            <span className="cardtooltiptext">{cardState.name}</span>
            {isLoading ? <p>{cardState.name} </p> : undefined}
        </div>
    )
}

export default DropTarget(
    CARD,
    {
        canDrop: () => false,
        hover(props: CardProps, monitor: DropTargetMonitor) {
            const { id: draggedId } = monitor.getItem()
            const { cardId: overId } = props

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
        CARD,
        {
            beginDrag: (props: CardProps) => ({
                id: props.cardId,
                originalIndex: props.findCard(props.cardId),
            }),
            endDrag(props: CardProps, monitor: DragSourceMonitor) {
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
    )(Card),
)