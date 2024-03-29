import React from 'react'

import './_style.css';
import cardBack from '../images/Magic_card_back.jpg'
import logoSkewed from '../images/react_logo_skewed.png'
import CardDB from '../CardDB';
import { ClientState } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { drawing, drawLine, hoveredCard } from '../Actions';
import { usePlayerActions } from "../PlayerDispatch";


export interface CardProps {
    cardId: number,
    borderStyle?: string,
    imageSize?: string,
    cardHeight?: number,
    showCollectorInfo?: boolean,
    showTransformed?: boolean
}

const Card: React.FC<CardProps> = ({ cardId, imageSize, cardHeight, showCollectorInfo, showTransformed }) => {

    const card = useSelector((state: ClientState) => state.game.cards[cardId])
    const tableCard = useSelector((state: ClientState) => state.game.tableCards[cardId])
    const ownerColor = useSelector((state: ClientState) => state.game.players[tableCard?.owner]?.color)

    const drawingFirst = useSelector((state: ClientState) => state.drawing.first)
    const drawerColor = useSelector((state: ClientState) => state.game.players.hasOwnProperty(state.playerPrefs.name)
        ? state.game.players[state.playerPrefs.name].color
        : "gray")
    const dispatch = useDispatch()
    const { info: infoDispatch } = usePlayerActions()

    if (!card || !tableCard) {
        return <div className={`Card cardtooltip c-${cardId}`}>{`Card ${cardId}`}</div>
    }
    const sfCard = CardDB.getCard(tableCard?.sf_id);

    const ratio = imageSize === "small" ? 146 / 204.0 : 488 / 680.0;
    const cardWidth = cardHeight ? cardHeight * ratio : undefined;

    // altText, url
    const getFront = () => {
        if (card.facedown) {
            return ["Card Back", cardBack]
        }
        if (sfCard) {
            let face = sfCard.face
            if (sfCard.faces.length > 0) {
                // xor to allow seeing the other side of card upon request
                face = ((card.transformed || showTransformed) && !(card.transformed && showTransformed))? sfCard.faces[1] : sfCard.faces[0]
                // split cards have faces but only main face has images
                if (!face.normal) {
                    face = sfCard.face
                }
            }
            const text = showCollectorInfo
                ? `${face?.name || sfCard.name} (${sfCard.set_name.toUpperCase()}) ${sfCard.number}`
                : `${face?.name || sfCard.name}`
            const tokenSuffix = tableCard.token ? " (Token)" : "";
            // small is 10.8k (memory cache after 1st). fuzzy text, hard to read. 146 x 204
            // normal is 75.7k (memory cache after 1st). readable. 488 x 680
            const img = imageSize === "small" ? face?.small : face?.normal
            return img ? [text + tokenSuffix, img] : ["Card Image Not Found", logoSkewed]
        } else
            return ["Card Not Found", logoSkewed]
    }

    const front = getFront()

    const click = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (drawingFirst === '') {
            dispatch(drawing(`c-${cardId}`))
            event.preventDefault()
            return
        }
        if (drawingFirst !== null && drawingFirst !== '') {
            infoDispatch('player_draw', drawLine({ color: drawerColor, from: drawingFirst, to: `c-${cardId}` }))
            dispatch(drawing(null))
            event.preventDefault()
            return;
        }
    }

    const link = `https://scryfall.com/card/${sfCard.set_name}/${sfCard.number}`

    return (
        // c${cardId} is a class used for line drawing
        <div className={`Card cardtooltip c-${cardId}`}
            onMouseOver={() => dispatch(hoveredCard(cardId))}
            onMouseOut={() => dispatch(hoveredCard(null))}
            onClick={click}
            style={{
                height: cardHeight ? cardHeight + "em" : undefined,
                width: cardWidth ? cardWidth + "em" : undefined,
            }}
        >
            {card.facedown ? null
                : <span className="cardtooltiptext"
                    style={{
                        fontSize: showCollectorInfo ? "normal" : "small",
                        backgroundColor: showCollectorInfo ? "white" : "black",
                        color: showCollectorInfo ? undefined : "white",
                    }}
                >
                    {!showCollectorInfo ? front[0] :
                        <a target="_blank" rel="noopener noreferrer" href={link}>{front[0]}</a>
                    }
                </span>}
            <img style={{ borderColor: ownerColor, background: ownerColor }} src={front[1]} alt={front[0]} />
        </div>
    )
}

const MemoizeCard = React.memo(Card)
export default MemoizeCard