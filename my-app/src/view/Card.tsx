import React from 'react'

import './_style.css';
import CardDB from '../CardDB';
import {ClientState} from '../ClientState';
import {useSelector, useDispatch} from 'react-redux';
import {drawing, drawLine, hoveredCard} from '../Actions';
import {usePlayerDispatch} from "../PlayerDispatch";


export interface CardProps {
    cardId: number,
    borderStyle?: string,
    imageSize?: string,
    cardHeight?: number,
    showCollectorInfo?: boolean
}

const Card: React.FC<CardProps> = ({cardId, imageSize, cardHeight, showCollectorInfo}) => {

    const card = useSelector((state: ClientState) => state.game.cards[cardId])
    const ownerColor = useSelector((state: ClientState) => state.game.players[card?.owner]?.color)

    const drawingFirst = useSelector((state: ClientState) => state.drawing.first)
    const drawerColor = useSelector((state: ClientState) => state.game.players.hasOwnProperty(state.playerPrefs.name)
        ? state.game.players[state.playerPrefs.name].color
        : "gray")
    const dispatch = useDispatch()
    const {draw: drawDispatch} = usePlayerDispatch()

    if(!card) {
        return <div className={`Card cardtooltip c-${cardId}`}>{`Card ${cardId}`}</div>
    }
    const sfCard = CardDB.getCard(card?.sf_id);

    const ratio = imageSize === "normal" ? 488 / 680.0 : 146 / 204.0;
    const cardWidth = cardHeight ? cardHeight * ratio : undefined;

    // altText, url
    const getFront = () => {
        if (card.facedown) {
            return ["Card Back", "/Magic_card_back.jpg"]
        }
        if (sfCard) {
            let face = sfCard.face
            if (sfCard.faces.length > 0) {
                face = card.transformed ? sfCard.faces[1] : sfCard.faces[0]
                // split cards have faces but only main face has images
                if (!face.normal) {
                    face = sfCard.face
                }
            }
            const text = showCollectorInfo 
                ? `${face?.name || sfCard.name} (${sfCard.set_name.toUpperCase()}) ${sfCard.number}`
                : `${face?.name || sfCard.name}`
            // small is 10.8k (memory cache after 1st). fuzzy text, hard to read. 146 x 204
            // normal is 75.7k (memory cache after 1st). readable. 488 x 680
            const img = imageSize === "normal" ? face?.normal : face?.small
            return img ? [text, img] : ["Card Image Not Found", "/react_logo_skewed.png"]
        } else
            return ["Card Not Found", "/react_logo_skewed.png"]
    }

    const front = getFront()

    const click = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (drawingFirst === '') {
            dispatch(drawing(`c-${cardId}`))
            event.preventDefault()
            return
        }
        if (drawingFirst !== null && drawingFirst !== '') {
            drawDispatch(drawLine({color: drawerColor, from: drawingFirst, to: `c-${cardId}`}))
            dispatch(drawing(null))
            event.preventDefault()
            return;
        }
    }

    return (
        // c${cardId} is a class used for line drawing
        <div className={`Card cardtooltip c-${cardId}`}
             onMouseOver={() => dispatch(hoveredCard(cardId))}
             onMouseOut={() => dispatch(hoveredCard(null))}
             onClick={click}
             style={{
                 height: cardHeight ? cardHeight + "em" : undefined, 
                 width: cardWidth ? cardWidth + "em" : undefined
             }}
        >
            {card.facedown ? null
                : <span className="cardtooltiptext">
                    {`${front[0]}`} </span>}
            <img style={{borderColor: ownerColor}} src={front[1]} alt={front[0]}/>
        </div>
    )
}

export default Card