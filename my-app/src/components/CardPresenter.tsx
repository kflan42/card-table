import React from 'react'

import './zeStyle.css';
import { Card } from '../Game';
import { useDispatch } from 'react-redux';
import { toggleTap } from '../Actions';

interface CPP {
    card: Card
}

const CardPresenter: React.FC<CPP> = (props) => {

     // https://react-redux.js.org/api/hooks#usedispatch
    const dispatch = useDispatch()

    return (
        <>
        <div className="Card" onClick={()=>dispatch(toggleTap(props.card.id))}>
            <p>Card {props.card.id} {props.card.tapped ? "T" : "UnT"}</p>
        </div>
        </>
    )
}

export default CardPresenter