import React from 'react'
import ExampleSquare from './ExampleSquare'

import { ItemTypes } from './Constants'
import { useDrop } from 'react-dnd'
import { moveKnight, canMoveKnight } from './ExampleGame'
import Overlay from './Overlay'

function BoardSquare({ x, y, children }) {
    const black = (x + y) % 2 === 1
    const [{ isOver, canDrop }, drop] = useDrop({
        accept: ItemTypes.CARD,
        canDrop: () => canMoveKnight(x, y),
        drop: () => moveKnight(x, y),
        collect: monitor => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    })

    return (
        <div
            ref={drop}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
            }}
        >
            <ExampleSquare black={black}>
                {children}
                </ExampleSquare>
                {isOver && !canDrop && <Overlay color="red" />}
                {!isOver && canDrop && <Overlay color="yellow" />}
                {isOver && canDrop && <Overlay color="green" />}
               
            {/* {isOver && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: '100%',
                        zIndex: 1,
                        opacity: 0.5,
                        backgroundColor: 'yellow',
                    }}
                />
            )} */}
        </div>
    )
}

export default BoardSquare