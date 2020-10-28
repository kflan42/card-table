import React, { useEffect } from "react"
import Card from "./Card"
import { DragCard, ItemTypes } from "./DnDUtils"
import { useDrag } from "react-dnd"
import { getEmptyImage } from "react-dnd-html5-backend"


interface StackCardP {
    cardId: number,
    height: number,
    width: number,
    zone: string,
    owner: string,
}


const StackCard: React.FC<StackCardP> = ({ cardId, height, width, zone, owner }) => {

    const dragCard: DragCard = {
        type: ItemTypes.CARD, cardId: cardId, srcZone: zone, srcOwner: owner
    }

    const [, drag, preview] = useDrag({
        item: dragCard,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    })

    useEffect(() => {
        // hide default html drag preview since we have a custom one based on the card props
        preview(getEmptyImage(), { captureDraggingState: true })
    }, [preview])

    return (
        <div ref={drag} className="StackCard" style={{height: height + "em", width: width + "em"}}>
            <Card cardId={cardId} />
        </div>
    )
}


export default StackCard