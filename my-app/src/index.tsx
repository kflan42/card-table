
import React from 'react'
import ReactDOM from 'react-dom'
import { DndProvider } from 'react-dnd'
import Backend from 'react-dnd-html5-backend'
import GameView from './view/GameView'

import './view/MyStyles.css';

function App() {
    return (
        <div className="App">
            <DndProvider backend={Backend}>
                <GameView />
            </DndProvider>
        </div>
    )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
