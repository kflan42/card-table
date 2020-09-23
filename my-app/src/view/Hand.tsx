import React, { useState } from 'react'

import './_style.css';
import {ClientState, HAND} from '../ClientState';
import {useSelector} from 'react-redux';
import {useDrop, DropTargetMonitor} from 'react-dnd';
import MemoizeHandCard from './HandCard';
import {ItemTypes, DragCard} from './DnDUtils';
import {usePlayerActions} from '../PlayerDispatch';
import {analyzeColor} from "./Login";

export interface HandProps {
}

const Hand: React.FC<HandProps> = () => {

    const zoneState = useSelector((state: ClientState) => {
        return state.game.zones[`${state.playerPrefs.name}-${HAND}`]
    })

    const playerColor = useSelector((state: ClientState) => {
        return state.game.players[state.playerPrefs.name].color;
    });

    const {action:playerAction, queue:queueAction, baseAction} = usePlayerActions()

    const [cardOrder, setCardOrder] = useState<number[]>([])

    const [, drop] = useDrop({
        accept: [ItemTypes.CARD, ItemTypes.BFCARD],
        canDrop: (item: DragCard, monitor: DropTargetMonitor) => {
            return item.srcOwner !== zoneState?.owner || item.srcZone !== HAND
        },
        drop(item: DragCard, monitor: DropTargetMonitor) {
            if (monitor.didDrop()) {
                return; // don't duplicate HandCard's efforts
            }
            // allow cross zone moves on drop
            const cardMove = {
                card_id: item.cardId,
                src_zone: item.srcZone,
                src_owner:item.srcOwner,
                tgt_zone: HAND,
                tgt_owner: zoneState?.owner,
                to_idx: null // last
            }
            playerAction({...baseAction(), card_moves:[cardMove]})
        },
    })

    let displayOrder = zoneState.cards
    let sameCards = cardOrder.length === zoneState.cards.length
    const cardOrderSet = new Set(cardOrder)
    for (let i = 0; i < zoneState.cards.length && sameCards; i++) {
        sameCards = sameCards && cardOrderSet.has(zoneState.cards[i])
    }

    if (sameCards) {
        displayOrder = cardOrder
    } else {
        setCardOrder(zoneState.cards) // reset since gained or lost a card
    }

    const reorderCard = (cardId:number, toIdx:number) => {
        const srcIndex = displayOrder.findIndex(v=> v===cardId)
        if (srcIndex === toIdx) {
            return
        }
        const newOrder = []
        for (let index = 0; index < displayOrder.length; index++) {
            const cid = displayOrder[index];
            if (index === toIdx && toIdx < srcIndex) {
                newOrder.push(cardId) // moved card forward to new spot
            }
            if (cid !== cardId) {
                newOrder.push(cid); // all but the moved card
            }
            if (index === toIdx && toIdx > srcIndex) {
                newOrder.push(cardId) // moved card back to new spot
            }
        }
        setCardOrder(newOrder)
        const cardMove = {
            card_id: cardId,
            src_zone: HAND,
            src_owner:zoneState.owner,
            tgt_zone: HAND,
            tgt_owner: zoneState.owner,
            to_idx: toIdx
        }
        queueAction({...baseAction(), card_moves:[cardMove]})
    }


    const listItems = []
    if (zoneState) {
        let i = 0;
        for (const cardId of displayOrder) {
            listItems.push(
                <MemoizeHandCard key={cardId} cardId={cardId} handIdx={i++} 
                    owner={zoneState.owner} reorderCard={reorderCard}/>
            )
        }
    }

    const {luminance} = analyzeColor(playerColor)
    const frontColor = luminance > 0.5 ? "black" : "white"

    return (
        <div ref={drop} className="Hand" style={{backgroundColor: playerColor}}>
            <span
                style={{
                    userSelect: "none",
                    color: frontColor,
                    writingMode: "vertical-lr", textOrientation: "upright",
                    minHeight: "5em"
                }}>
                Hand
            </span>
            {listItems}
        </div>
    )
}

export default Hand