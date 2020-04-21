import React, { useState } from 'react'
import { randchoice } from '../Utilities'
import Card from './Card'
import { createTestGame } from '../zzzState'

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

    const game = createTestGame()
    const player = randchoice(Object.keys(game.players))
    const testDeck = game.players[player].deck.map(i => game.cards[i].name)

    const size = 7;

    const listItems = []
    if (shown) {
        // keep DOM element count down by not rendering cards user can't see
        for (let n = 0; n < size; n++) {
            const name = randchoice(testDeck)
            listItems.push(<Card key={n}
                name={name}
            />
            )
        }
    }

    return (
        // todo later disable text cursor
        <>
            <div className="buttontooltip">
                <div style={shown ? { boxShadow: "1pt 1pt 1pt black" } : {}}
                    onClick={e => clicked(e)} className="TextButton">
                    {label} {`${size}`}
                </div>
                <span className="buttontooltiptext">{props.name}</span>
                <div className="StackPopUpBox" style={shown ? {} : { display: "none" }}>
                    {/* <div>{props.name}</div> */}
                    <div className="CardStack">
                        {listItems}
                    </div>
                </div>
            </div>
        </>
    )
}

export default CardStack