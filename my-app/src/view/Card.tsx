import React, { useState, useEffect } from 'react'

import './_style.css';
import CardDB from '../CardDB';
import { CardData } from '../CardDB';
import { ClientState } from '../ClientState';
import { useSelector } from 'react-redux';

interface CardProps {
    cardId: number,
    height?: number
}

const Card: React.FC<CardProps> = (props) => {

    const cardState = useSelector((state: ClientState) => state.game.cards[props.cardId])

    // small is 10.8k (memory cache after 1st). fuzzy text, hard to read
    // normal is 75.7k (memory cache after 1st). readable

    const [isLoading, setIsLoading] = useState(false)
    const [cardData, setData] = useState<CardData>()

    // TODO move card db load to ClientState
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)
            const response = await CardDB.getCard(cardState.name)
            setData(response)
            setIsLoading(false)
        }
        fetchData()
    }, [cardState.name])


    const front = () => {
        if (cardData) {
            return cardData.face_small ? cardData.face_small :
                cardData.faces_small ? cardData.faces_small[cardState.name] :
                    "react_logo_skewed.png" // not found placeholder
        }
        else
            return "react_logo_skewed.png" // loading placeholder
    }

    return (
        <div className={"Card cardtooltip"}
            style={{
                backgroundImage: `url("${front()}")`,
                backgroundSize: 'cover',
                backgroundRepeat: "no-repeat",
                minHeight: props.height?  `${props.height}pt` : undefined
            }}
        >
            <span className="cardtooltiptext">{cardState.name}</span>
            {isLoading ? <p>{cardState.name} </p> : undefined }
        </div>
    )
}

export default Card