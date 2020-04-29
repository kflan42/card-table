import React from 'react'

import './_style.css';
import Card from './Card';

interface CardPopupProps {
    cardId: number,
    transformed: boolean
}

const CardPopup: React.FC<CardPopupProps> = ({ cardId }) => {

    const center = window.innerWidth / 2
    const middle = window.innerHeight / 2

    const width = window.innerWidth / 4
    const height = (width * 680) / 488
    /* normal image is 488 x 680 */

    return (
        <div className="Popup"
            style={{
                left: center - width / 2 + "px",
                top: middle - height / 2 + "px",
                width: width + "px",
                height: height + "px",
            }}
        >
            <Card cardId={cardId} borderStyle="0.3em solid" imageSize="normal" ></Card>
        </div>
    )

}

export default CardPopup