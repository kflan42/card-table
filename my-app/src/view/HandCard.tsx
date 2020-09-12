
import React, {useEffect, useState} from 'react'


import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import Card from './Card';
import { ItemTypes, DragCard } from './DnDUtils';
import { HAND, ClientState } from '../ClientState';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { usePlayerActions } from '../PlayerDispatch';
import { useSelector} from "react-redux";
import { PlayerAction } from '../magic_models';


interface HandCardProps {
    cardId: number,
    handIdx: number,
    owner: string,
    reorderCard: (cardId:number, idx:number)=>void
}


const HandCard: React.FC<HandCardProps> = ({
    cardId,
    handIdx,
    owner,
    reorderCard
}) => {
    const cardHeight = useSelector((state: ClientState) => {
        return state.playerPrefs.handCardSize;
    })

    const {action:playerDispatch, baseAction} = usePlayerActions()

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

    const [moveSent, setMoveSent] = useState<PlayerAction | null>(null)

    function moveCard(item: DragCard) {
        if (item.cardId !== cardId) {
            const cardMove = {
                card_id: item.cardId,
                src_zone: item.srcZone,
                src_owner:item.srcOwner,
                tgt_zone: HAND,
                tgt_owner: owner,
                to_idx: handIdx,
            }
            // avoid spamming server as hover fires every render which is faster than server dispatching
            if (moveSent && moveSent.when > Date.now() - 2000
                && moveSent.card_moves[0].card_id === item.cardId 
                && moveSent.card_moves[0].to_idx === handIdx) {
                return
            }
            const action = {...baseAction(), card_moves:[cardMove]}
            setMoveSent(action)
            playerDispatch(action)
        }
    }

    const [, drop] = useDrop({
        accept: [ItemTypes.CARD, ItemTypes.BFCARD],
        hover(item: DragCard, monitor: DropTargetMonitor) {
            if (item.srcOwner === owner && item.srcZone === HAND) {
                reorderCard(item.cardId, handIdx) // reorder hand on hover
            }
        },
        drop(item: DragCard, monitor: DropTargetMonitor) {
            moveCard(item); // allow cross zone moves on drop
            return {} // empty object says we handled it
        },
    })

    const opacity = isDragging ? 0 : 1

    return (
        <div ref={(node) => drag(drop(node))} style={{ opacity, margin:"0.1em" }}>
            <Card cardId={cardId} imageSize={"normal"} cardHeight={cardHeight} ></Card>
        </div>
    )
}

const MemoizeHandCard = React.memo(HandCard)
export default MemoizeHandCard