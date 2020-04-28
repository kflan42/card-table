import React from 'react'

import './_style.css';
import CardDB from '../CardDB';
import { CardData } from '../CardDB';
import { ClientState } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { hoveredCard } from '../Actions';
import { useAsync, PromiseFn } from "react-async"


const loadCardData: PromiseFn<CardData> = async ({ cardName }): Promise<CardData> => {
    return await CardDB.getCard(cardName)
}

export interface CardProps {
    cardId: number,
    borderStyle?: string,
    imageSize?: string,
}

const Card: React.FC<CardProps> = ({
    cardId,
    imageSize,
}) => {

    const cardState = useSelector((state: ClientState) => state.game.cards[cardId])

    const ownerColor = useSelector((state: ClientState) => state.game.players[cardState.owner].color)

    // small is 10.8k (memory cache after 1st). fuzzy text, hard to read
    // normal is 75.7k (memory cache after 1st). readable

    const { data, error, isPending } = useAsync(loadCardData, { cardName: cardState.name })

    // TODO move card db load to ClientState

    const cardData = data ? data : null;

    const front = () => {
        if (cardState.facedown) {
            return "Magic_card_back.jpg"
        }
        if (cardData) {
            const faces = imageSize === "normal" ? cardData.faces_normal : cardData.faces_small
            if (cardState.transformed && faces) {
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

    const click = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log(event)
    }

    if (error) {
        console.error(`Problem loading card ${cardState.name} ${error.message}`)
    }

    return (
        <div className={"Card cardtooltip"}
            onMouseOver={() => dispatch(hoveredCard(cardId))}
            onMouseOut={() => dispatch(hoveredCard(null))}
            onClick={click}
            style={{
                backgroundImage: `url("${front()}")`,
                borderColor: ownerColor,
            }}
        >
            {cardState.facedown ? null : <span className="cardtooltiptext">{cardState.name}</span>}
            {isPending ? <p>{cardState.name} </p> : null}
            {error ? <p>{`${cardState.name} Errored`}  </p> : null}
        </div>
    )
}

export default Card