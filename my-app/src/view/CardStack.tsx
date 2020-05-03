import React, { useState, ChangeEvent } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getZone } from '../zzzState'
import { ClientState, LIBRARY } from '../ClientState'
import StackCard from './StackCard'
import { useDrop, DropTargetMonitor } from 'react-dnd'
import { ItemTypes, DragCard } from './DnDUtils'
import { MoveCard, MOVE_CARD, shuffleLibrary } from '../Actions'
import { useConfirmation } from './ConfirmationService'
import { ConfirmationResult } from './ConfirmationDialog'

interface CardStackP {
    name: string
    icon?: string
    owner: string
}


const CardStack: React.FC<CardStackP> = ({ name, icon = null, owner }) => {

    const [shown, setShown] = useState(false)
    const [query, setQuery] = useState('')
    const [topN, setTopN] = useState<number[]>([])

    const zoneState = useSelector((state: ClientState) => {
        return getZone(state.game, owner, name)
    })

    const cards = useSelector((state: ClientState) => state.game.cards)

    const dispatch = useDispatch()
    const confirmation = useConfirmation();

    function stackButtonClicked(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (!shown) {
            if (zoneState.name === LIBRARY) {
                confirmation({
                    choices: ["Search", "Look at Top _"],
                    catchOnCancel: true,
                    title: `Look at ${zoneState.name}?`,
                    description: "",
                    location: { x: e.clientX, y: e.clientY }
                })
                    .then((s: ConfirmationResult) => {
                        switch (s.choice) {
                            case "Search":
                                setTopN([]);
                                break;
                            case "Look at Top _":
                                setTopN(zoneState.cards.slice(0, s.n))
                                break;
                        }
                        setShown(true)
                        setQuery('')
                    })
                    .catch(() => setShown(false));
            } else {
                setShown(true)
                setQuery('')
            }
        } else {
            setShown(false)
        }
    }

    function closeShuffleClicked(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        setShown(!shown)
        if (!shown) {
            setQuery('')
        }
        dispatch(shuffleLibrary(owner))
    }

    function queryChanged(event: ChangeEvent<HTMLInputElement>) {
        setQuery(event.target.value)
    }

    const label = icon ? icon : name;

    const [{ isOver }, drop] = useDrop({
        accept: [ItemTypes.BFCARD, ItemTypes.CARD],
        drop(item: DragCard, monitor: DropTargetMonitor) {
            if (item.srcOwner === owner && item.srcZone === zoneState.name) {
                return //nothing to do if in same zone, not doing order here like that
            }
            let i = -1;
            if (zoneState.name === LIBRARY) {
                confirmation({
                    choices: ["Top", "Insert _ From Top", "Bottom"],
                    catchOnCancel: true,
                    title: `Put Card Where?`,
                    description: "",
                    location: { x: monitor.getClientOffset()?.x || 0, y: monitor.getClientOffset()?.y || 0 }
                })
                    .then((s: ConfirmationResult) => {
                        switch (s.choice) {
                            case "Top":
                                i = 0;
                                break;
                            case "Insert _ From Top":
                                i = s.n; // 0 based indexing
                                break;
                            case "Bottom":
                                i = zoneState.cards.length;
                                break;
                        }

                    })
                    .catch(() => i = -1);
            } else {
                i = zoneState.cards.length // drop on bottom
            }
            if (i > -1) {
                const cardMove: MoveCard = {
                    ...item,
                    type: MOVE_CARD,
                    when: Date.now(),
                    tgtZone: name,
                    tgtOwner: owner,
                    toIdx: i
                }
                dispatch(cardMove)
            }
        },
        collect: (monitor: DropTargetMonitor) => ({
            isOver: monitor.isOver()
        }),
    })

    const size = zoneState ? zoneState.cards.length : 0
    const cardsShown = topN.length > 0 ? topN.length : size

    function renderPopupBox() {
        const target_cols = 1 + Math.floor(cardsShown / 8)
        const cards_per_col = Math.round(cardsShown / target_cols)
        const cardPortionShown = Math.max(1 / 8, Math.min(2 / cards_per_col, 1))
        const cardHeight = 15.3 * cardPortionShown
        const cardWidth = (cardHeight / cardPortionShown * 146) / 204 // show top 1/7th, use small image ratio
        const boxHeight = cardHeight * cards_per_col * 1.1; // .1 margins, scrollbar
        const boxWidth = cardWidth * Math.min(target_cols, 4)
        const listItems = []
        if (zoneState) {
            const cardsToShow = topN.length > 0 ? topN : zoneState.cards
            for (let i = 0; i < cardsToShow.length; i++) {
                const cardId = cardsToShow[i];
                if (zoneState.cards.indexOf(cardId) < 0) { continue } // skip cards removed since opened topN
                if (!query
                    || cards[cardId].facedown
                    || cards[cardId].name.toLowerCase().indexOf(query.toLowerCase()) > -1) {
                    listItems.push(
                        <StackCard key={cardId} cardId={cardId} height={cardHeight} width={cardWidth}
                            zone={name} owner={owner} />
                    )
                }
            }
        }

        return (<div className="StackPopUpBox">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0.1em" }}>
                <span>{name}</span>
                {cardsShown > 7
                    ? <span>Search:<input value={query} type="text" id="query" name="query" onChange={queryChanged} /></span>
                    : null}
                {name === LIBRARY
                    ? <button style={{ textAlign: "right", cursor: "pointer" }} onClick={e => closeShuffleClicked(e)}>
                        Close &amp; Shuffle</button>
                    : null}
                <button style={{ textAlign: "right", cursor: "pointer" }} onClick={e => setShown(false)}>
                    Close </button>
            </div>
            <div className="CardStack" style={{
                fontSize: "small", // match Card
                height: `${boxHeight}em`,
                width: `${boxWidth}em`
            }}>
                {listItems}
            </div>
        </div>
        )
    }

    return (
        <>
            <div ref={drop} className="buttontooltip"
                style={{
                    backgroundColor: isOver ? "darkGray" : undefined,
                    border: shown ? "0.1em solid black" : undefined,
                }}>
                <div onClick={e => stackButtonClicked(e)} className="DivButton">
                    {label} {`${size}`}
                </div>
                <span className="buttontooltiptext" style={{ visibility: isOver ? "visible" : undefined }}>
                    {name}
                </span>
                {shown ? renderPopupBox() : null}
            </div>
        </>
    )
}

export default CardStack