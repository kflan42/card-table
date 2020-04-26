import React from 'react'

import './_style.css';
import { ClientState } from '../ClientState';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTap } from '../Actions';
import Card from './Card';

interface BFCardProps {
    bfId: number,
}

const BFCard: React.FC<BFCardProps> = ({ bfId }) => {

    const bfState = useSelector((state: ClientState) => state.game.battlefieldCards[bfId])

    const dispatch = useDispatch()

    const cardProps = { cardId: bfState.cardId }

    return (
        <div
            // TODO later: border = owner sleeve color
            style={{
                position: "absolute",
                top: bfState.y + "%",
                left: bfState.x + "%",
                transform: bfState.tapped ? "rotate(90deg)" : "",
                transition: "top 1s, left 1s, transform 0.5s, background-image 1s",
                transitionTimingFunction: "ease-in"
            }}
            onClick={() => dispatch(toggleTap(bfState.bfId))}
        >
            {/* {bfState && bfState.transformed ? " T" : ""} */}
            <Card cardId={cardProps.cardId}
                facedown={bfState.facedown}
                transformed={bfState.transformed}
                borderStyle="0.15em solid" ></Card>
        </div>
    )

}

// avoid re-rendering on every parent re-render https://react-redux.js.org/api/hooks#performance
const MemoizedBFCard = React.memo(BFCard)
export default MemoizedBFCard