import React, { useEffect } from "react"
import Card from "./Card"
import { DragCard, ItemTypes } from "./DnDUtils"
import { useDrag } from "react-dnd"
import { getEmptyImage } from "react-dnd-html5-backend"


interface StackCardP {
    cardId: number,
    height: number,
    zone: string,
    owner: string,
}


const StackCard: React.FC<StackCardP> = ({ cardId, height, zone, owner }) => {

    const dragCard: DragCard = {
        type: ItemTypes.CARD, cardId: cardId, srcZone: zone, srcOwner: owner
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

    const opacity = isDragging ? 0 : 1

    return (
        <div ref={drag} style={{ height: height + "em", width:"7.3em", overflowY: "hidden", opacity }}>
            <Card cardId={cardId} />
        </div>
    )
}


export default StackCard