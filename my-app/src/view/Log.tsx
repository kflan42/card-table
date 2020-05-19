import React, { useRef, useEffect } from 'react'

import './_style.css';
import Clock from './Clock';
import { useSelector } from 'react-redux';
import { ClientState } from '../ClientState';
import {LogLine} from "../magic_models";
import {analyzeColor} from "./Login";



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

    function renderLogLine(logLine: LogLine) {
        let otherPlayers = Object.keys(players).filter(p => p !== logLine.who)
        const crossPlayer = otherPlayers.find(p => logLine.line.includes(p)) !== undefined
        const whoColor = players[logLine.who]?.color || "black"

        const {brightness} = analyzeColor(whoColor)
        const frontColor = brightness > 128 * 3 ? "black" : "white"
        return <div key={i++} style={{ margin: "0.1em", color: crossPlayer ? "DarkRed" : undefined }}>
            <span style={{
                color: frontColor,
                backgroundColor: whoColor,
                fontWeight: "bold"
            }}>{logLine.who}</span> {logLine.line}
        </div>
    }

    return (
        <div className="Log">
            <Clock></Clock>
            <div style={{
                flexGrow: 1,
                overflowY: "scroll",
                padding: "0.1em",
                minWidth: "20em",
                maxWidth: "20em",
                fontSize: "small",

            }}>
                {logLines.map(renderLogLine)}
                <div ref={linesEndRef}>----</div>
            </div>
        </div>
    )
}

export default Log