import React from 'react'

import './_style.css';
import Card from './Card';

interface CardPopupProps {
    cardId: number,
    transformed: boolean
}

const CardPopup: React.FC<CardPopupProps> = ({ cardId, transformed }) => {

    const center = window.innerWidth / 2
    const middle = window.innerHeight / 2

    const width = window.innerWidth / 4
    const height = (width * 680) / 488
    /* normal image is 488 x 680 */

    return (
        <div className="CardPopup"
            style={{
                position: "absolute",
                left: center - width / 2 + "px",
                top: middle - height / 2 + "px",
                minWidth: width + "px",
                minHeight: height + "px",
                display: "flex",
                zIndex: 2,
            }}
        >
            <Card cardId={cardId} transformed={transformed} borderStyle="0.3em solid" imageSize="normal" ></Card>
        </div>
    )

}

export default CardPopup