import React from 'react'

import './_style.css';
import CardDB from '../CardDB';
import {ClientState} from '../ClientState';
import {useSelector, useDispatch} from 'react-redux';
import {hoveredCard} from '../Actions';


export interface CardProps {
    cardId: number,
    borderStyle?: string,
    imageSize?: string,
}

const Card: React.FC<CardProps> = ({cardId, imageSize}) => {

    const card = useSelector((state: ClientState) => state.game.cards[cardId])

    const ownerColor = useSelector((state: ClientState) => state.game.players[card.owner].color)

    // small is 10.8k (memory cache after 1st). fuzzy text, hard to read
    // normal is 75.7k (memory cache after 1st). readable

    const sfCard = CardDB.getCard(card.sf_id);

    // altText, url
    const getFront = () => {
        if (card.facedown) {
            return ["Card Back", "Magic_card_back.jpg"]
        }
        if (sfCard) {
            let face = sfCard.face
            if(sfCard.faces.length > 0) {
                face = card.transformed ? sfCard.faces[1] : sfCard.faces[0]
            }
            const img = imageSize === "normal" ? face?.normal : face?.small
            return img ? [sfCard.name, img] : ["Card Image Not Found", "react_logo_skewed.png"]
        } else
            return ["Card Not Found", "react_logo_skewed.png"]
    }

    const front = getFront()

    const dispatch = useDispatch()

    const click = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log(event)
    }

    return (
        <div className={"Card cardtooltip"}
             onMouseOver={() => dispatch(hoveredCard(cardId))}
             onMouseOut={() => dispatch(hoveredCard(null))}
             onClick={click}
        >
            {card.facedown ? null
                : <span className="cardtooltiptext">
                    {`${front[0]}${card.token ? " (Token)" : ""}`} </span>}
            <img style={{borderColor: ownerColor}} src={front[1]} alt={front[0]}/>
        </div>
    )
}

export default Card