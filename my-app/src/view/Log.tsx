import React, { useRef, useEffect } from 'react'

import './_style.css';
import { useSelector } from 'react-redux';
import { ClientState } from '../ClientState';
import { analyzeColor } from "./RoomForm";



const Log: React.FC = () => {

    const logLines = useSelector((state: ClientState) => state.game.actionLog)

    const players = useSelector((state: ClientState) => state.game.players)

    const linesEndRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null)

    const scrollToBottom = () => {
        if (linesEndRef.current) {
            linesEndRef.current.scrollIntoView({ behavior: "auto" })
        }
    }
    useEffect(scrollToBottom, [logLines]);

    let i = 0;

    const renderedLines = []
    let currentPlayer = ''
    for(const logLine of logLines) {
        let otherPlayers = Object.keys(players).filter(p => p !== logLine.who)
        const crossPlayer = otherPlayers.find(p => logLine.line.includes(p)) !== undefined
        const whoColor = players[logLine.who]?.color || "black"
        const { luminance } = analyzeColor(whoColor)
        const frontColor = luminance > 0.5 ? "black" : "white"

        if (logLine.who !== currentPlayer) {
            const when = new Date(logLine.when).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            })
            renderedLines.push(
                <div key={i++} style={{ margin: "0.1em", color: frontColor, backgroundColor: whoColor }}>
                    {when} {logLine.who}
                </div>
            )
            currentPlayer = logLine.who
        }
        const when = new Date(logLine.when).toLocaleTimeString([], {
            minute: '2-digit',
            second: '2-digit'
        })
        renderedLines.push(
            <div key={i++} style={{ margin: "0.1em", color: crossPlayer ? "DarkRed" : undefined }}>
                :{when}  {logLine.line}
            </div>
        )
    }


    return (
            <div style={{
                flexGrow: 1,
                overflowY: "scroll",
                padding: "0.1em",
                fontSize: "small",

            }}>
                {renderedLines}
                <div ref={linesEndRef}>
                    ----
                </div>
            </div>
    )
}

const MemoizeLog = React.memo(Log)
export default MemoizeLog