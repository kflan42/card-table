import React, { useState, useEffect } from 'react'

import './_style.css';
import CardDB from '../CardDB';
import { CardData } from '../CardDB';
import { ClientState } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTap } from '../Actions';

interface BFCardProps {
    bfId: number
}

const BFCard: React.FC<BFCardProps> = (props) => {

    const cardState = useSelector((state: ClientState) => {
        return state.game.cards[state.game.battlefieldCards[props.bfId].cardId]
    })
    const bfState = useSelector((state: ClientState) => state.game.battlefieldCards[props.bfId])

    const dispatch = useDispatch()

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
        if (bfState.facedown === true) {
            return "Magic_card_back.jpg"
        }
        if (cardData) {
            if (bfState && bfState.transformed && cardData.faces_small) {
                for (const f in cardData.faces_small) {
                    if (f !== cardState.name) return cardData.faces_small[f];
                }
            }
            return cardData.face_small ? cardData.face_small :
                cardData.faces_small ? cardData.faces_small[cardState.name] :
                    "react_logo_skewed.png" // not found placeholder
        }
        else
            return "react_logo_skewed.png" // not found placeholder
    }

    try {
        return (
            <div
                className={"Card cardtooltip"}
                // TODO later: border = owner sleeve color
                style={{
                    top: bfState.y + "%",
                    left: bfState.x + "%",
                    backgroundImage: `url("${front()}")`,
                    backgroundSize: 'cover',
                    backgroundRepeat: "no-repeat",
                    transform: bfState.tapped ? "rotate(90deg)" : ""
                }}
                onClick={()=>dispatch(toggleTap(bfState.bfId))}
            >
                <span className="cardtooltiptext">{cardState.name}</span>
                {isLoading ? <p>{`${cardState.name} ${bfState && bfState.transformed ? " T" : ""}`}</p>
                    : undefined}
            </div>
        )
    } catch (e) {
        console.error(`${cardState.name} error rendering:`, e)
        return <div className={"Card"}>
            {cardState.name} error rendering. See console.
            </div>
    }
}

// avoid re-rendering on every parent re-render https://react-redux.js.org/api/hooks#performance
const MemoizedBFCard = React.memo(BFCard)
export default MemoizedBFCard