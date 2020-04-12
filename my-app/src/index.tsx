
import React from 'react'
import ReactDOM from 'react-dom'
import { DndProvider } from 'react-dnd'
import Backend from 'react-dnd-html5-backend'
import GameView from './view/GameView'

import './view/MyStyles.css';
import Upload from './Upload'

function App() {
    return (
        <div className="App">
            <Upload></Upload>
            <DndProvider backend={Backend}>
                <GameView />
            </DndProvider>
        </div>
    )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
