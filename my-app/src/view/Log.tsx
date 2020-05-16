import React, { useRef, useEffect } from 'react'

import './_style.css';
import Clock from './Clock';
import { useSelector } from 'react-redux';
import { ClientState } from '../ClientState';
import {LogLine} from "../magic_models";



const Log: React.FC = () => {

    const logLines = useSelector((state: ClientState) => state.game.actionLog)

    const players = useSelector((state: ClientState) => Object.keys(state.game.players))

    const linesEndRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null)

    const scrollToBottom = () => {
        if (linesEndRef.current) {
            linesEndRef.current.scrollIntoView({ behavior: "auto" })
        }
    }
    useEffect(scrollToBottom, [logLines]);

    let i = 0;

    function renderLogLine(logLine: LogLine) {
        const words = logLine.line.split(/[ ']/)
        let otherPlayers = players.filter(p => p !== logLine.who)
        const crossPlayer = words.filter(w => otherPlayers.includes(w)).length > 0

        return <div key={i++} style={{ margin: "0.1em", color: crossPlayer ? "DarkRed" : undefined }}>
            <strong>{logLine.who}</strong> {logLine.line}
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