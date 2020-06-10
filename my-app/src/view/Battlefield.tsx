import React, {useRef} from 'react'

import './_style.css';
import {useSelector} from 'react-redux';
import {ClientState, BATTLEFIELD} from '../ClientState';
import BFCard from './BFCard';
import {useDrop} from 'react-dnd';
import {ItemTypes, DragCard} from "./DnDUtils";
import {MOVE_CARD} from '../Actions';
import {usePlayerDispatch} from '../PlayerDispatch';

/** Takes px and returns %. */
export function snapToGrid(x: number, y: number, width: number, height: number) {
    // ensure x and y are on battlefield in case drop got weird coords
    x = Math.min(Math.max(0, x), width - 1)
    y = Math.min(Math.max(0, y), height - 1)
    // proportion * 10 * 10 = %. round in middle to grid.
    const snappedX = Math.round((x / width) * 32) * 3 + 2
    const snappedY = Math.round((y / height) * 32) * 3 + 2
    return [snappedX, snappedY]
}

interface BFP {
    player: string,
}

const Battlefield: React.FC<BFP> = ({player}) => {

    const zoneState = useSelector((state: ClientState) => {
        return state.game.zones[`${player}-${BATTLEFIELD}`]
    })

    const bfCardsState = useSelector((state: ClientState) => {
        return state.game.battlefieldCards
    })

    const playerDispatch = usePlayerDispatch().action

    const bf = useRef<HTMLDivElement>(null);

    const [, drop] = useDrop({
        accept: [ItemTypes.BFCARD, ItemTypes.CARD],
        drop(item: DragCard, monitor) {
            const pos = monitor.getSourceClientOffset() as {
                x: number
                y: number
            }
            // clientOffset seems to be where mouse pointer is
            // sourceClientOffset seems to be where element dragged is (regardless of where clicked)
            // console.log(monitor.getClientOffset(), monitor.getInitialClientOffset(),
            //     monitor.getSourceClientOffset(), monitor.getInitialSourceClientOffset())
            let left = Math.round(pos.x);
            let top = Math.round(pos.y);
            const c = bf.current
            if (c) {
                // convert to relative
                const r = c.getBoundingClientRect()
                left = left - r.left;
                top = top - r.top;
                [left, top] = snapToGrid(left, top, r.width, r.height)
            }

            const cardMove = {
                ...item,
                type: MOVE_CARD,
                when: Date.now(),
                tgtZone: BATTLEFIELD,
                tgtOwner: player,
                toX: left,
                toY: top
            }
            playerDispatch(cardMove)
        },
    })

    const listItems = []
    try {
        if (zoneState) {
            for (const bfId of zoneState.cards) {
                listItems.push(<BFCard key={bfId} bfId={bfId} fieldOwner={player}/>)
            }
        }
        // sort most recent changes to last so they end up on top
        listItems.sort((a, b) => bfCardsState[a.props.bfId].last_touched - bfCardsState[b.props.bfId].last_touched)
    } catch (e) {
        console.error(e, zoneState.cards, bfCardsState)
    }

    return (
        <div ref={bf} style={{
            flexGrow: 1,
        }}>
            <div ref={drop} className="Battlefield">
                {listItems}
            </div>
        </div>
    )
}

const MemoizedBF = React.memo(Battlefield)
export default MemoizedBF