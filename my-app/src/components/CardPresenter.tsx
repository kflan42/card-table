import React from 'react'

import './zeStyle.css';
import { Card } from '../Game';

interface CPP {
    card: Card
    onClick: () => void
}

const CardPresenter: React.FC<CPP> = (props) => {

    return (
        <>
        <div className="Card" onClick={props.onClick}>
            <p>Card {props.card.id} {props.card.tapped ? "T" : "UnT"}</p>
        </div>
        </>
    )
}

export default CardPresenter