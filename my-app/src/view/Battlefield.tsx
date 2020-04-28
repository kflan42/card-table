import React, { useRef } from 'react'

import './_style.css';
import { useSelector, useDispatch } from 'react-redux';
import { ClientState, BATTLEFIELD } from '../ClientState';
import MemoizedBFCard from './BFCard';
import { useDrop } from 'react-dnd';
import { ItemTypes, DragCard } from "./DnDUtils";
import { MoveCard, MOVE_CARD } from '../Actions';

/** Takes px and returns %. */
export function snapToGrid(x: number, y: number, width: number, height: number) {
    // proportion * 10 * 10 = %. round in middle to grid to 10%.
    const snappedX = Math.round((x / width) * 20) * 5
    const snappedY = Math.round((y / height) * 20) * 5
    return [snappedX, snappedY]
}

interface BFP {
    player: string,
}

const Battlefield: React.FC<BFP> = ({ player }) => {

    const zoneState = useSelector((state: ClientState) => {
        return state.game.battlefields[player]
    })

    const bfCardsState = useSelector((state: ClientState) => {
        return state.game.battlefieldCards
    })

    const dispatch = useDispatch()

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

            const cardMove: MoveCard = {
                ...item,
                type: MOVE_CARD,
                when: Date.now(),
                tgtZone: BATTLEFIELD,
                tgtOwner: player,
                toX: left,
                toY: top
            }
            dispatch(cardMove)
        },
    })

    const listItems = []
    if (zoneState) {
        for (const bfId of zoneState.battlefieldCards) {
            listItems.push(<MemoizedBFCard key={bfId} bfId={bfId} fieldOwner={player} />)
        }
    }
    // sort most recent changes to last so they end up on top
    listItems.sort((a, b) => bfCardsState[a.props.bfId].changed - bfCardsState[b.props.bfId].changed)

    return (
        <div ref={bf} style={{
            width: "100%",
            height: "100%",
            flexGrow: 1,
        }}>
            <div ref={drop} className="Battlefield">
                {listItems}
            </div>
        </div>
    )
}

export default Battlefield