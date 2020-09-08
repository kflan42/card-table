import React from 'react'

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

    const {action:playerDispatch, baseAction} = usePlayerActions()

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
            playerDispatch({...baseAction(), card_moves:[cardMove]})
        },
    })


    const listItems = []
    if (zoneState) {
        let i = 0;
        for (const cardId of zoneState.cards) {
            listItems.push(
                <MemoizeHandCard key={cardId} cardId={cardId} handIdx={i++} owner={zoneState.owner}/>
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