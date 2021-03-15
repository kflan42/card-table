import React, { useEffect } from 'react'

import './_style.css';
import { ClientState, BATTLEFIELD } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { hoveredBFCard, TOGGLE_TAP_CARD, SET_CARD_COUNTER } from '../Actions';
import Card from './Card';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { ItemTypes, DragCard } from './DnDUtils';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useConfirmation } from './ConfirmationService';
import { ConfirmationResult } from './ConfirmationDialog';
import { usePlayerActions } from '../PlayerDispatch';

interface BFCardProps {
    bfId: number,
    fieldOwner: string,
}

export const NoName = "No-Name";
const BFCard: React.FC<BFCardProps> = ({ bfId, fieldOwner }) => {

    const bfState = useSelector((state: ClientState) => state.game.battlefieldCards[bfId])

    const [cardHeight, imageSize] = useSelector((state: ClientState) => {
        return [state.playerPrefs.bfCardSize, state.playerPrefs.bfImageSize] as [number, string];
    })

    const dispatch = useDispatch()
    const {action:playerDispatch, baseAction} = usePlayerActions()

    const cardProps = { cardId: bfState?.card_id }

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

    function counterClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>, kind: string, value: number) {
        confirmation({
            choices: ["▲", "Set to _", "▼"],
            catchOnCancel: true,
            title: `Adjust ${kind} from ${value} to `,
            description: "",
            location: { x: e.clientX, y: e.clientY },
            initialNumber: value
        })
            .then((s: ConfirmationResult) => {
                var newValue = s.n;
                switch (s.choice) {
                    case "▲":
                        newValue = value + 1;
                        break;
                    case "Set to _":
                        newValue = s.n;
                        break;
                    case "▼":
                        newValue = value - 1;
                        break;
                }
                playerDispatch({
                    ...baseAction(),
                    kind: SET_CARD_COUNTER,
                    counter_changes: [{
                        player: null,
                        card_id: cardProps.cardId,
                        name: kind,
                        value: newValue
                    }]
                })
            })
            .catch(() => null);
        e.preventDefault();
    }

    if (!bfState) {
        // if we just moved the card this might re-render for the field it's on removes it
        return null
    }

    const counters = [];
    for (const counter of bfState.counters) {
        const count = counter.value
        const m = counter.name.match(/([+-])(\d+)\/([+-])(\d+)/)
        let label = <> {counter.name === NoName ? "" : counter.name} </>
        if (m) {
            // e.g. show two +1/+1 counters as +2/+2
            const left = Number.parseInt(m[2]) * count
            const right = Number.parseInt(m[4]) * count
            label = <> <sup>{m[1]}{left}</sup>/<sub>{m[3]}{right}</sub> </>
        }
        const showCount = !m && (count > 1 || counter.name === NoName)
        const labelmultiplier = showCount ? count : null
        counters.push(
            <div
                key={counter.name}
                style={{
                    fontSize: "small",
                    fontFamily: "Arial",
                    backgroundColor: "goldenrod",
                    color: "black",
                    borderRadius: "25%",
                    width: "fit-content",
                    height: "fit-content",
                    padding: "0.1em",
                    margin: "0.05em",
                }}
                onClick={(e) => counterClick(e, counter.name, count)}
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
                transform: bfState.tapped || bfState.flipped ? 
                            "rotate("+ ((bfState.tapped ? 90 : 0) + (bfState.flipped ? 180: 0)) + "deg)" :
                            undefined,
                transition: "top 0.25s, left 0.25s, transform 0.25s, opacity 0.25s",
                transitionTimingFunction: "ease-in",
                opacity: isDragging ? 0.5 : undefined,
            }}
            onMouseOver={() => dispatch(hoveredBFCard(bfId, cardProps.cardId))}
            onMouseOut={() => dispatch(hoveredBFCard(null))}
            onClick={(e) => {
                if (!e.isDefaultPrevented()) playerDispatch({
                    ...baseAction(),
                    kind: TOGGLE_TAP_CARD, 
                    card_changes:[{card_id:cardProps.cardId, change:TOGGLE_TAP_CARD, to_x: null, to_y: null}]
                })
            }}
        >
            <Card cardId={cardProps.cardId} borderStyle={borderWidth + " solid"} 
                  cardHeight={cardHeight} imageSize={imageSize} ></Card>
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