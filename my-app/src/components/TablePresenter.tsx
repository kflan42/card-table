import React from 'react'

import './zeStyle.css';
import { Card } from '../Game';
import CardPresenter from './CardPresenter';

interface TPP {
    cards: { [index: number]: Card }
    onCardClick: (id: number) => void
}

const TablePresenter: React.FC<TPP> = (props) => {

    return (
        <>
            <div className="Table">
                <h1>Table</h1>
                {Object.values(props.cards).map((value) => (
                    <CardPresenter key={value.id} card={value} onClick={() => props.onCardClick(value.id)}></CardPresenter>
                ))}
            </div>
        </>
    )
}

export default TablePresenter