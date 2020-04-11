import React from 'react'

import './MyStyles.css';
import FieldView from './FieldView';
import HandView from './HandView';

export interface GameViewState {

}

const GameView: React.FC<GameViewState> = ({}) => {

    return (
        <>
        <div className="GameView">
            <h1>GameView</h1>
            <FieldView></FieldView>
            <HandView></HandView>
        </div>
        </>
    )
}

export default GameView