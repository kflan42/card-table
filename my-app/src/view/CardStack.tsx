import React, { useState } from 'react'
import { testDeck, randchoice } from './CardDB'
import Card from './Card'

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

    const testSizes: { [index: string]: number } = {
        "Hand": 7,
        "Library": 82,
        "Graveyard": 10,
        "Command Zone": 1,
        "Sideboard (Exile)": 0
    }

    const size = testSizes[props.name];

    const listItems = []
    for (let n = 0; n < size; n++) {
        const name = randchoice(testDeck)
        listItems.push(<Card key={n}
            name={name}
        />
        )
    };

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