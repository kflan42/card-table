import React, { useState, useEffect } from 'react'

import './_style.css';
import CardDB from '../CardDB';
import { CardData } from '../CardDB';
import { ClientState } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { hoveredCard } from '../Actions';


export interface CardProps {
    cardId: number,
    borderStyle?: string,
    imageSize?: string,
    facedown?: boolean,
    transformed?: boolean,
}

const Card: React.FC<CardProps> = ({
    cardId,
    borderStyle,
    imageSize,
    facedown,
    transformed
}) => {

    const cardState = useSelector((state: ClientState) => state.game.cards[cardId])

    const userColor = useSelector((state: ClientState) => state.game.players[cardState.owner].color)

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
        if (facedown) {
            return "Magic_card_back.jpg"
        }
        if (cardData) {
            const faces = imageSize === "normal" ? cardData.faces_normal : cardData.faces_small
            if (transformed && faces) {
                for (const f in faces) {
                    if (f !== cardState.name) return faces[f];
                }
            }
            const face = imageSize === "normal" ? cardData.face_normal : cardData.face_small
            return face ? face : faces ? faces[cardState.name] : "react_logo_skewed.png" // not found placeholder
        }
        else
            return "react_logo_skewed.png" // loading placeholder
    }

    const dispatch = useDispatch()

    const mouseOver = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        dispatch(hoveredCard(cardId))
    }

    const mouseOut = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        dispatch(hoveredCard(null))
    }

    const click = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log(event)
    }

    return (
        <div className={"Card cardtooltip"}
            onMouseOver={mouseOver}
            onMouseOut={mouseOut}
            onClick={click}
            style={{
                backgroundImage: `url("${front()}")`,
                border: borderStyle ? borderStyle + " " + userColor : undefined,
            }}
        >
            <span className="cardtooltiptext">{cardState.name}</span>
            {isLoading ? <p>{cardState.name} </p> : undefined}
        </div>
    )
}

export default Card