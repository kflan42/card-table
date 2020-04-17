import React from 'react'

import './zeStyle.css';
import {  Game } from '../Game';
import CardPresenter from './CardPresenter';
import { useSelector } from 'react-redux';


const TablePresenter: React.FC = () => {

    // https://react-redux.js.org/api/hooks#useselector-examples
    const cards = useSelector((state: Game) => state.cards)

    return (
        <>
            <div className="Table">
                <h1>Table</h1>
                {Object.values(cards).map((value) => (
                    <CardPresenter key={value.id} card={value}></CardPresenter>
                ))}
            </div>
        </>
    )
}

// todo https://react-redux.js.org/api/hooks#performance memoize props to render
export default TablePresenter