import React, { useState } from 'react'
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

    function clicked(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        console.log(`clicked ${props.name} ${e}`)
        setShown(!shown)
    }

    const label = props.icon ? props.icon : props.name;

    const zoneState = useSelector((state: ClientState) => {
        if (state.playerName) {
            return getZone(state.game, state.playerName, props.name)
        } else {
            return undefined
        }
    })

    const size = zoneState ? zoneState.cards.length : 0

    const heightClip = Math.max(17, Math.min(71 / (size / 5), 71))
    const boxHeight = Math.min(heightClip * size, 255)

    const listItems = []
    if (zoneState && shown) {
        for (const cardId of zoneState.cards) {
            listItems.push(<Card key={cardId} cardId={cardId} height={heightClip} />)
        }
    }

    return (
        // TODO later disable text cursor
        <>
            <div className="buttontooltip">
                <div style={shown ? { boxShadow: "1pt 1pt 1pt black" } : {}}
                    onClick={e => clicked(e)} className="TextButton">
                    {label} {`${size}`}
                </div>
                <span className="buttontooltiptext">{props.name}</span>
                {shown
                    ? <div className="StackPopUpBox">
                        {/* <div>{props.name}</div> */}
                        <div className="CardStack" style={{ height: `${boxHeight}pt` }}>
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