import React from 'react'
import { XYCoord, useDragLayer } from 'react-dnd'
import { ItemTypes, DragCard } from './DnDUtils'
import BFCard from './BFCard'
import Card from './Card'
import { HAND, ClientState } from '../ClientState'
import { useSelector } from 'react-redux'
import { snapToGrid } from './Battlefield'

const layerStyles: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    // right: 0,
    // bottom: 0,
    // width: '100%',
    // necessary for this to have size 0x0 so relative BF card positions don't make them offset while dragging!
    height: '100%',
}

function getItemStyles(
    initialOffset: XYCoord | null,
    currentOffset: XYCoord | null,
    bf: HTMLDivElement | null,
) {
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none',
        }
    }

    let { x, y } = currentOffset
    if (bf) {
        // snap to bf grid if we're over the bf
        const snappedBfOffsetPc = snapToGrid(bf, currentOffset, false)
        if (snappedBfOffsetPc) {
            const r = bf.getBoundingClientRect()
            x = r.left + snappedBfOffsetPc[0]/100.0 * r.width
            y = r.top + snappedBfOffsetPc[1]/100.0 * r.height
        }
    }

    const transform = `translate(${x}px, ${y}px)`
    return {
        transform,
        WebkitTransform: transform,
    }
}

// beware, keypress doesn't work here, and only modifier keys can affect actions
// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations

const CustomDragLayer: React.FC = () => {
    const {
        itemType,
        isDragging,
        item,
        initialOffset,
        currentOffset,
        pointerOffset
    } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        pointerOffset: monitor.getClientOffset(),
        isDragging: monitor.isDragging(),
    }))

    const hoveredBf = useSelector((state: ClientState) => { return state.hoveredCard.bf })

    function renderItem() {
        switch (itemType) {
            case ItemTypes.BFCARD:
                const b = item as DragCard
                if (b.bfId !== undefined)
                    return <BFCard bfId={b.bfId} fieldOwner={b.srcOwner} />
                else
                    return null
            case ItemTypes.CARD:
                const c = item as DragCard
                if (c.srcZone === HAND && pointerOffset && initialOffset && pointerOffset.y > initialOffset.y) {
                    // render for hand
                    return <div className="DragHandCard">
                        <Card cardId={c.cardId} />
                    </div>
                } else {
                    // render for table
                    return <Card cardId={c.cardId} />
                }
            default:
                return null
        }
    }

    if (!isDragging) {
        return null
    }
    return (
        <div style={layerStyles} className="DragLayer">
            <div
                style={getItemStyles(initialOffset, currentOffset, hoveredBf)}
            >
                {renderItem()}
            </div>
        </div>
    )
}
export default CustomDragLayer
