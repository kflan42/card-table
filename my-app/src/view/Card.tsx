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

    // altText, url
    const front = () => {
        if (cardState.facedown) {
            return ["Card Back", "Magic_card_back.jpg"]
        }
        if (cardData) {
            const faces = imageSize === "normal" ? cardData.faces_normal : cardData.faces_small
            if (cardState.transformed && faces) {
                for (const f in faces) {
                    if (f !== cardState.name) return [f, faces[f]];
                }
            }
            const face = imageSize === "normal" ? cardData.face_normal
                : cardData.face_small
            return face ? [cardState.name, face]
                : faces ? [cardState.name, faces[cardState.name]]
                    : ["Card Not Found", "react_logo_skewed.png"]
        }
        else
            return ["Loading Card", "react_logo_skewed.png"]
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
        >
            {cardState.facedown ? null : <span className="cardtooltiptext">{front()[0]}</span>}
            {isPending ? <p>{`${cardState.name} Pending`}</p> : null}
            {error ? <p>{`${cardState.name} Error`}</p> : null}
            <img style={{ borderColor: ownerColor }} src={front()[1]} alt={front()[0]} />
        </div>
    )
}

export default Card