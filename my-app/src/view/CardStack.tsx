import React, { useState, ChangeEvent } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getZone } from '../zzzState'
import { ClientState } from '../ClientState'
import StackCard from './StackCard'
import { useDrop, DropTargetMonitor } from 'react-dnd'
import { ItemTypes, DragCard } from './DnDUtils'
import { MoveCard, MOVE_CARD } from '../Actions'

interface CardStackP {
    name: string
    icon?: string
    owner: string
}


const CardStack: React.FC<CardStackP> = ({ name, icon = null, owner }) => {

    const [shown, setShown] = useState(false)
    const [query, setQuery] = useState('')

    function clicked(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        console.log(`clicked ${name} ${e}`)
        setShown(!shown)
        if (!shown) {
            setQuery('')
        }
    }

    function queryChanged(event: ChangeEvent<HTMLInputElement>) {
        setQuery(event.target.value)
    }

    const label = icon ? icon : name;

    const zoneState = useSelector((state: ClientState) => {
        return getZone(state.game, owner, name)
    })

    const cards = useSelector((state: ClientState) => state.game.cards)

    const dispatch = useDispatch()

    const [{ isOver }, drop] = useDrop({
        accept: [ItemTypes.BFCARD, ItemTypes.CARD],
        drop(item: DragCard, monitor: DropTargetMonitor) {
            const cardMove: MoveCard = {
                ...item,
                type: MOVE_CARD,
                when: Date.now(),
                tgtZone: name,
                tgtOwner: owner
            }
            dispatch(cardMove)
        },
        collect: (monitor: DropTargetMonitor) => ({
            isOver: monitor.isOver()
        }),
    })

    const size = zoneState ? zoneState.cards.length : 0

    function renderPopupBox() {
        const target_cols = Math.ceil(Math.log(size + 1));
        const cards_per_col = Math.ceil(size / target_cols)
        const cardHeight = Math.max(1.5, Math.ceil(10 / cards_per_col))
        const boxHeight = cardHeight * cards_per_col
        const boxWidth = 7.3 * target_cols;
        const listItems = []
        if (zoneState) {
            for (const cardId of zoneState.cards) {
                if (!query
                    || cards[cardId].facedown
                    || cards[cardId].name.toLowerCase().indexOf(query.toLowerCase()) > -1) {
                    listItems.push(
                        <StackCard key={cardId} cardId={cardId} height={cardHeight}
                            zone={name} owner={owner} />
                    )
                }
            }
        }

        return (<div className="StackPopUpBox">
            {size > 7
                ? <div>{name} Search:<input value={query} type="text" id="query" name="query" onChange={queryChanged} /></div>
                : undefined}
            <div className="CardStack" style={{
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
                    border: shown ? "0.05em solid black" : undefined,
                }}>
                <div onClick={e => clicked(e)} className="TextButton">
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