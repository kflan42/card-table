import React, {useRef} from 'react'

import './_style.css';
import {useSelector, useDispatch} from 'react-redux';
import {ClientState, BATTLEFIELD} from '../ClientState';
import BFCard from './BFCard';
import {useDrop, XYCoord} from 'react-dnd';
import {ItemTypes, DragCard} from "./DnDUtils";
import {MOVE_CARD, hoveredBattlefield} from '../Actions';
import {usePlayerActions} from '../PlayerDispatch';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

/** Takes px and returns %. */
export function snapToGrid(c: HTMLDivElement, sourceClientOffset: XYCoord, clipToBounds: boolean) {
    let { x, y } = sourceClientOffset
    // convert to relative
    const r = c.getBoundingClientRect()
    x = x - r.left;
    y = y - r.top;
    if (clipToBounds){
        // ensure x and y are on battlefield in case drop got weird coords
        x = Math.min(Math.max(0, x), r.width - 1)
        y = Math.min(Math.max(0, y), r.height - 1)
    } else if (x < 0 || x > r.width || y < 0 || y > r.height) {
        // outside bounds, can't snap sensibly
        return undefined
    }
    // proportion * 10 * 10 = %. round in middle to grid. playmat usually a wide rectangle
    const snappedX = Math.round((x / r.width) * 33) * 3
    const snappedY = Math.round((y / r.height) * 25) * 4
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

    const {action:playerDispatch, baseAction} = usePlayerActions()
    const dispatch = useDispatch()
    
    const bf = useRef<HTMLDivElement>(null);

    const [, drop] = useDrop({
        accept: [ItemTypes.BFCARD, ItemTypes.CARD],
        drop(item: DragCard, monitor) {
            // clientOffset seems to be where mouse pointer is
            // sourceClientOffset seems to be where element dragged is (regardless of where clicked)
            // console.log(monitor.getClientOffset(), monitor.getInitialClientOffset(),
            //     monitor.getSourceClientOffset(), monitor.getInitialSourceClientOffset())
            const c = bf.current
            if (c) {
                const [left, top] = snapToGrid(c, monitor.getSourceClientOffset() as XYCoord, true) as number[]

                const cardMoves = item.srcOwner !== player || item.srcZone !== BATTLEFIELD ? [{
                    card_id: item.cardId,
                    src_zone: item.srcZone,
                    src_owner: item.srcOwner,
                    tgt_zone: BATTLEFIELD,
                    tgt_owner: player,
                    to_idx: null
                }] : []
                const bfChange = {card_id:item.cardId, change: MOVE_CARD, to_x: left, to_y: top}
                playerDispatch({
                    ...baseAction(),
                    card_moves:cardMoves,
                    card_changes:[bfChange]
                })
            }
        },
        collect(monitor) {
            const xy = monitor.getSourceClientOffset()
            if(monitor.isOver() && xy && bf.current) {
                dispatch(hoveredBattlefield(bf.current, xy))
                console.log("hovered", xy)
            }
        }
    })

    var listItems: JSX.Element[] = []
    try {
        if (zoneState) {
            for (const bfId of zoneState.cards) {
                if (bfId in bfCardsState) {
                    listItems.push(<BFCard key={bfId} bfId={bfId} fieldOwner={player}/>)
                } else {
                    console.error(bfId, "in", zoneState.owner, zoneState.name, "but not bfCardState")
                }
            }
        }
        // sort most recent changes to last so they end up on top
        listItems.sort((a, b) => bfCardsState[a.props.bfId].last_touched - bfCardsState[b.props.bfId].last_touched)
        // wrap each element in a transition handler
        listItems = listItems.map(e => <CSSTransition key={player + "_" + e.props.bfId} timeout={250} classNames="fadeInOut">{e}</CSSTransition>)
    } catch (e) {
        console.error(e, zoneState.cards, bfCardsState)
    }

    return (
        <div ref={bf} style={{
            flexGrow: 1,
        }}>
            <div ref={drop} className="Battlefield">
                <TransitionGroup>
                    {listItems}
                </TransitionGroup>
            </div>
        </div>
    )
}

const MemoizedBF = React.memo(Battlefield)
export default MemoizedBF