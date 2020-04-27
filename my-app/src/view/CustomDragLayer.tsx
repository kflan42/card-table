import React from 'react'
import { XYCoord, useDragLayer } from 'react-dnd'
import { ItemTypes, DragCard } from './DnDUtils'
import MemoizedBFCard from './BFCard'

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
) {
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none',
        }
    }

    let { x, y } = currentOffset

    // x -= initialOffset.x
    // y -= initialOffset.y
    // //TODO requires width x height of BF we're over. Snaps on actual move anyway though. ;[x, y] = snapToGrid(x, y)
    // x += initialOffset.x
    // y += initialOffset.y


    const transform = `translate(${x}px, ${y}px)`
    return {
        transform,
        WebkitTransform: transform,
    }
}


const CustomDragLayer: React.FC = () => {
    const {
        itemType,
        isDragging,
        item,
        initialOffset,
        currentOffset,
    } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }))

    function renderItem() {
        switch (itemType) {
            case ItemTypes.BFCARD:
                const b = item as DragCard
                if (b.bfId)
                    return <MemoizedBFCard bfId={b.bfId} fieldOwner={b.srcOwner} />
                else
                    return null
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
                style={getItemStyles(initialOffset, currentOffset)}
            >
                {renderItem()}
            </div>
        </div>
    )
}
export default CustomDragLayer
