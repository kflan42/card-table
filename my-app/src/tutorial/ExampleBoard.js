import React from 'react'
import ExampleSquare from './ExampleSquare'
import ExampleBoardSquare from './ExampleBoardSquare'
import ExampleCard from './ExampleCard'
import { canMoveKnight, moveKnight } from './ExampleGame'

import { DndProvider } from 'react-dnd'
import Backend from 'react-dnd-html5-backend'

function renderSquare(i, knightPosition) {
    const x = i % 8
    const y = Math.floor(i / 8)
    return (
      <div key={i} style={{ width: '12.5%', height: '12.5%' }}>
        <ExampleBoardSquare x={x} y={y}>
          {renderPiece(x, y, knightPosition)}
        </ExampleBoardSquare>
      </div>
    )
  }
  
  function renderPiece(x, y, [knightX, knightY]) {
    if (x === knightX && y === knightY) {
      return <ExampleCard />
    }
  }

function handleSquareClick(toX, toY) {
    if (canMoveKnight(toX, toY)) {
        moveKnight(toX, toY)
    }
}

export default function Board({ knightPosition }) {
    const squares = []
    for (let i = 0; i < 64; i++) {
        squares.push(renderSquare(i, knightPosition))
    }

    return (
        <DndProvider backend={Backend}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexWrap: 'wrap',
                }}
            >
                {squares}
            </div>
        </DndProvider>
    )
}