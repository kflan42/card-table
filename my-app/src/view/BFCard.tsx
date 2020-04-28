import React, { useEffect } from 'react'

import './_style.css';
import { ClientState, BATTLEFIELD } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { hoveredBFCard, TOGGLE_TAP_CARD, cardAction } from '../Actions';
import Card from './Card';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { ItemTypes, DragCard } from './DnDUtils';
import { getEmptyImage } from 'react-dnd-html5-backend';

interface BFCardProps {
    bfId: number,
    fieldOwner: string,
}

const BFCard: React.FC<BFCardProps> = ({ bfId, fieldOwner }) => {

    const bfState = useSelector((state: ClientState) => state.game.battlefieldCards[bfId])

    const dispatch = useDispatch()

    const cardProps = { cardId: bfState?.cardId }

    const dragCard: DragCard = {
        type: ItemTypes.BFCARD, bfId, cardId: cardProps.cardId, srcZone: BATTLEFIELD, srcOwner: fieldOwner
    }

    const [{ isDragging }, drag, preview] = useDrag({
        item: dragCard,
        collect: (monitor: DragSourceMonitor) => ({
            isDragging: monitor.isDragging(),
        }),
    })

    useEffect(() => {
        // hide default html drag preview since we have a custom one based on the card props
        preview(getEmptyImage(), { captureDraggingState: true })
    }, [preview])

    return (
        !bfState ? null :
            <div
                ref={drag}
                style={{
                    position: "absolute",
                    top: bfState.y + "%",
                    left: bfState.x + "%",
                    transform: bfState.tapped ? "rotate(90deg)" : "",
                    transition: "top 0.5s, left 0.5s, transform 0.5s, background-image 1s",
                    transitionTimingFunction: "ease-in",
                    opacity: isDragging ? 0.25 : undefined,
                }}
                onMouseOver={() => dispatch(hoveredBFCard(bfId, cardProps.cardId))}
                onMouseOut={() => dispatch(hoveredBFCard(null))}
                onClick={() => dispatch(cardAction(TOGGLE_TAP_CARD, bfState.bfId))}
            >
                <Card cardId={cardProps.cardId}
                    borderStyle="0.15em solid" ></Card>
            </div>
    )

}

// avoid re-rendering on every parent re-render https://react-redux.js.org/api/hooks#performance
const MemoizedBFCard = React.memo(BFCard)
export default MemoizedBFCard