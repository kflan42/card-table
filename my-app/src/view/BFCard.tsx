import React, { useEffect } from 'react'

import './_style.css';
import { ClientState, BATTLEFIELD } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { hoveredBFCard, TOGGLE_TAP_CARD, cardAction, setCardCounter } from '../Actions';
import Card from './Card';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { ItemTypes, DragCard } from './DnDUtils';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useConfirmation } from './ConfirmationService';
import { ConfirmationResult } from './ConfirmationDialog';
import { usePlayerDispatch } from '../PlayerDispatch';

interface BFCardProps {
    bfId: number,
    fieldOwner: string,
}

const BFCard: React.FC<BFCardProps> = ({ bfId, fieldOwner }) => {

    const bfState = useSelector((state: ClientState) => state.game.battlefieldCards[bfId])

    const dispatch = useDispatch()
    const playerDispatch = usePlayerDispatch()

    const cardProps = { cardId: bfState?.cardId }

    const dragCard: DragCard = {
        type: ItemTypes.BFCARD, bfId, cardId: cardProps.cardId, srcZone: BATTLEFIELD, srcOwner: fieldOwner
    }

    const [{ isDragging }, drag, preview] = useDrag({
        item: dragCard,
        collect: (monitor: DragSourceMonitor) => ({
            isDragging: monitor.isDragging(),
        }),
        options: {
            // copy, link, move, copyMove, copyLink, linkMove, all (Default)
            // dropEffect: 'link' // arrow icon
            // dropEffect: 'copy' // plus icon
            // dropEffect: 'move' // box icon
            // dropEffect: 'move' // box icon
            // then in useDrop can match on monitor.getDropResult()
            // see https://react-dnd.github.io/react-dnd/examples/dustbin/copy-or-move
        }
    })

    useEffect(() => {
        // hide default html drag preview since we have a custom one based on the card props
        preview(getEmptyImage(), { captureDraggingState: true })
    }, [preview])

    const confirmation = useConfirmation();

    function counterClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>, kind: string, current: number) {
        confirmation({
            choices: ["▲", "Set Count _", "▼"],
            catchOnCancel: true,
            title: `Adjust ${kind} x${current}`,
            description: "",
            location: { x: e.clientX, y: e.clientY }
        })
            .then((s: ConfirmationResult) => {
                switch (s.choice) {
                    case "▲":
                        playerDispatch(setCardCounter(bfId, kind, current + 1));
                        break;
                    case "Set Count _":
                        playerDispatch(setCardCounter(bfId, kind, s.n));
                        break;
                    case "▼":
                        playerDispatch(setCardCounter(bfId, kind, current - 1));
                        break;
                }
            })
            .catch(() => null);
        e.preventDefault();
    }

    if (!bfState) {
        // if we just moved the card this might re-render for the field it's on removes it
        return null
    }

    const counters = [];
    for (const counterLabel in bfState.counters) {
        const count = bfState.counters[counterLabel];
        const m = counterLabel.match(/([+-])(\d+)\/([+-])(\d+)/)
        let label = <> {counterLabel} </>
        if (m) {
            const left = Number.parseInt(m[2]) * count
            const right = Number.parseInt(m[4]) * count
            label = <> <sup>{m[1]}{left}</sup>/<sub>{m[3]}{right}</sub> </>
        }
        const labelmultiplier = m ? null
            : count > 1 ? "x" + count
                : null
        counters.push(
            <div
                key={counterLabel}
                style={{
                    fontSize: "smaller",
                    fontFamily: "Arial",
                    backgroundColor: "goldenrod",
                    color: "black",
                    borderRadius: "25%",
                    width: "fit-content",
                    height: "fit-content",
                    paddingLeft: "0.05em", paddingRight: "0.05em",
                    margin: "0.05em",
                }}
                onClick={(e) => counterClick(e, counterLabel, count)}
            >
                {label} {labelmultiplier}
            </div>
        );
    }

    const borderWidth = "0.15em";
    return (
        <div
            ref={drag}
            style={{
                position: "absolute",
                top: bfState.y + "%",
                left: bfState.x + "%",
                transform: bfState.tapped ? "rotate(90deg)" : "",
                transition: "top 0.5s, left 0.5s, transform 0.5s, background-image 0.5s",
                transitionTimingFunction: "ease-in",
                opacity: isDragging ? 0.25 : undefined,
            }}
            onMouseOver={() => dispatch(hoveredBFCard(bfId, cardProps.cardId))}
            onMouseOut={() => dispatch(hoveredBFCard(null))}
            onClick={(e) => {
                if (!e.isDefaultPrevented()) playerDispatch(cardAction(TOGGLE_TAP_CARD, bfState.bfId))
            }}
        >
            <Card cardId={cardProps.cardId} borderStyle={borderWidth + " solid"} ></Card>
            <div style={{
                // for counters
                position: "absolute",
                top: 0, left: borderWidth,
                width: "100%",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                paddingTop: "1em"
            }}>
                {counters}
            </div>
        </div>
    )

}

// avoid re-rendering on every parent re-render https://react-redux.js.org/api/hooks#performance
const MemoizedBFCard = React.memo(BFCard)
export default MemoizedBFCard