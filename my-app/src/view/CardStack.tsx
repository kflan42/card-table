import React, { useState, ChangeEvent } from 'react'
import Card from './Card'
import { useSelector } from 'react-redux'
import { getZone } from '../zzzState'
import { ClientState } from '../ClientState'

interface CardStackP {
    name: string
    icon?: string
}


const CardStack: React.FC<CardStackP> = (props) => {

    const [shown, setShown] = useState(false)
    const [query, setQuery] = useState('')

    function clicked(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        console.log(`clicked ${props.name} ${e}`)
        setShown(!shown)
    }

    function queryChanged(event: ChangeEvent<HTMLInputElement>) {
        setQuery(event.target.value)
    }

    const label = props.icon ? props.icon : props.name;

    const zoneState = useSelector((state: ClientState) => {
        if (state.playerPrefs.name) {
            return getZone(state.game, state.playerPrefs.name, props.name)
        } else {
            return undefined
        }
    })

    const cards = useSelector((state: ClientState) => state.game.cards)

    const size = zoneState ? zoneState.cards.length : 0
    const target_cols = Math.ceil(size / 16);
    const cards_per_col = Math.ceil(size / target_cols)
    const cardHeight = Math.max(1.5, Math.ceil(10 / cards_per_col))
    const boxHeight = cardHeight * cards_per_col
    const boxWidth = 6*target_cols;

    const findCard = (i:number)=>undefined
    const moveCard = (i:number, t:number) => {}

    const listItems = []
    if (zoneState && shown) {
        for (const cardId of zoneState.cards) {
            if (!query || cards[cardId].name.toLowerCase().indexOf(query.toLowerCase()) > -1) {
                listItems.push(<Card key={cardId} cardId={cardId} moveCard={moveCard} findCard={findCard} height={cardHeight} />)
            }
        }
    }

    return (
        // TODO later disable text cursor
        <>
            <div className="buttontooltip">
                <div style={shown ? { boxShadow: "0.1em 0.1em 0.1em black" } : {}}
                    onClick={e => clicked(e)} className="TextButton">
                    {label} {`${size}`}
                </div>
                <span className="buttontooltiptext">{props.name}</span>
                {shown
                    ? <div className="StackPopUpBox">
                        {size > 10
                            ? <div>{props.name} Search:<input value={query} type="text" id="query" name="query" onChange={queryChanged}/></div>
                            : undefined}
                        <div className="CardStack" style={{
                            height: `${boxHeight}em`,
                            width: `${boxWidth}em`
                        }} >
                            {listItems}
                        </div>
                    </div>
                    : undefined
                }
            </div>
        </>
    )
}

export default CardStack