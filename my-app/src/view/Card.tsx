import React, { useState, useEffect } from 'react'

import './_style.css';
import CardDB from '../CardDB';
import { CardData } from '../CardDB';

interface CardProps {
    name: string
    location?: string
    x?: number
    y?: number
    faceDown?: boolean
    transformed?: boolean
    tapped?: boolean
}

const Card: React.FC<CardProps> = (props) => {


    // small is 10.8k (memory cache after 1st). fuzzy text, hard to read
    // normal is 75.7k (memory cache after 1st). readable

    const [isLoading, setIsLoading] = useState(false)
    const [cardData, setData] = useState<CardData>()

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)
            const response = await CardDB.getCard(props.name)
            setData(response)
            setIsLoading(false)
        }
        fetchData()
    }, [props.name])


    const front = () => {
        if (props.faceDown === true) {
            return "Magic_card_back.jpg"
        }
        if (cardData) {
            if (props.transformed && cardData.faces) {
                for (const f in cardData.faces) {
                    if (f !== props.name) return cardData.faces[f];
                }
            }
            return cardData.face ? cardData.face :
                cardData.faces ? cardData.faces[props.name] :
                    "react_logo_skewed.png" // not found placeholder
        }
        else
            return "react_logo_skewed.png" // not found placeholder
    }

    return (
        <>
            <div
                className={"Card cardtooltip"}
                // todo later: border = owner sleeve color
                style={
                    (props.x && props.y) ? {
                        top: props.y + "%",
                        left: props.x + "%",
                        backgroundImage: `url("${front()}")`,
                        backgroundSize: 'cover',
                        backgroundRepeat: "no-repeat",
                        transform: props.tapped ? "rotate(90deg)" : ""
                    }
                        :
                        {
                            backgroundImage: `url("${front()}")`,
                            backgroundSize: 'cover',
                            backgroundRepeat: "no-repeat"
                        }}
            >
                <span className="cardtooltiptext">{props.name}</span>
                <p>{isLoading ? `${props.name} ${props.transformed ? " T" : ""}` : ""}</p>
            </div>
        </>
    )
}

export default Card