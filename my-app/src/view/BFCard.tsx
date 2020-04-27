import React, { useEffect } from 'react'

import './_style.css';
import { ClientState, BATTLEFIELD } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTap } from '../Actions';
import Card from './Card';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { ItemTypes } from './DnDUtils';
import { getEmptyImage } from 'react-dnd-html5-backend';

interface BFCardProps {
    bfId: number,
    fieldOwner: string,
}

const BFCard: React.FC<BFCardProps> = ({ bfId, fieldOwner }) => {

    const bfState = useSelector((state: ClientState) => state.game.battlefieldCards[bfId])

    const dispatch = useDispatch()

    const cardProps = { cardId: bfState.cardId }

    const [{ isDragging }, drag, preview] = useDrag({
        item: { type: ItemTypes.BFCARD, bfId, cardId: cardProps.cardId, srcZone: BATTLEFIELD, srcOwner: fieldOwner },
        collect: (monitor: DragSourceMonitor) => ({
            isDragging: monitor.isDragging(),
        }),
    })

    useEffect(() => {
        // preview(null, { captureDraggingState: true })
        // hide default html drag preview since we have a custom one based on the card props
        preview(getEmptyImage(), { captureDraggingState: true })
    }, [preview])

    return (
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
            onClick={() => dispatch(toggleTap(bfState.bfId))}
        >
            {/* {bfState && bfState.transformed ? " T" : ""} */}
            <Card cardId={cardProps.cardId}
                facedown={bfState.facedown}
                transformed={bfState.transformed}
                borderStyle="0.15em solid" ></Card>
        </div>
    )

}

// avoid re-rendering on every parent re-render https://react-redux.js.org/api/hooks#performance
const MemoizedBFCard = React.memo(BFCard)
export default MemoizedBFCard