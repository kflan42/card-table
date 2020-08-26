import React, { useRef, useEffect, useState } from 'react'

import './_style.css';
import Clock from './Clock';
import { useSelector } from 'react-redux';
import { ClientState } from '../ClientState';
import { LogLine } from "../magic_models";
import { analyzeColor } from "./Login";



const Log: React.FC = () => {

    const timerID = setInterval(
        () => tick(),
        1 * 1000
    );
    const [state, setState] = useState({ date: new Date() })


    useEffect(() => {
        return function cleanup() {
            if (timerID)
                clearInterval(timerID);
        }
    })

    const tick = () => {
        setState({
            date: new Date()
        });
    }

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
        const { luminance } = analyzeColor(whoColor)
        const frontColor = luminance > 0.5 ? "black" : "white"

        const when = new Date(logLine.when).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).substring(0, 8) // strip am/pm
        return <div key={i++} style={{ margin: "0.1em", color: crossPlayer ? "DarkRed" : undefined }}>
            {when} <span style={{
                color: frontColor,
                backgroundColor: whoColor
            }}>{logLine.who}</span> {logLine.line}
        </div>
    }

    const elapsedS = logLines.length > 0 
        ? Math.floor((state.date.getTime() - logLines[logLines.length - 1].when) / 1000)
        : 0
    const tooLong = elapsedS > 45
    const flash = elapsedS % 5 === 0

    return (
        <div className="Log">
            <Clock></Clock>
            <div style={{
                flexGrow: 1,
                overflowY: "scroll",
                padding: "0.1em",
                fontSize: "small",

            }}>
                {logLines.map(renderLogLine)}
                <div style={{
                    margin: "0.1em",
                    fontWeight: tooLong ? "bold" : undefined,
                    color: tooLong && flash ? "red" : undefined
                }} ref={linesEndRef}>
                {tooLong && flash ? " + "+ elapsedS + " seconds" : "----"}
                </div>
            </div>
        </div>
    )
}

export default Log