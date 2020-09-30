import React, { useEffect, useState } from 'react'

import './_style.css';
import Clock from './Clock';
import Log from './Log';
import { useSelector } from 'react-redux';
import { ClientState } from '../ClientState';
import { useHistory } from 'react-router-dom';



const Sidebar: React.FC = () => {

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

    const history = useHistory()
    const logLines = useSelector((state: ClientState) => state.game.actionLog)
    const elapsedS = logLines.length > 0 
        ? Math.floor((state.date.getTime() - logLines[logLines.length - 1].when) / 1000)
        : 0

    const tick = () => {
        setState({
            date: new Date()
        });
        if(elapsedS > 900) {
            history.push('/login')  // leave game and close socket so api server will spin down
        }
    }


    const tooLong = elapsedS > 45
    const flash = elapsedS % 15 <= 5

    return (
        <div className="Log">
            <Clock></Clock>
            <Log></Log>
                <div style={{
                    margin: "0.1em",
                    fontWeight: tooLong ? "bold" : undefined,
                    color: tooLong && flash ? "red" : undefined
                }}>
                {tooLong && flash ? " + "+ elapsedS + " seconds" : null}
                </div>
        </div>
    )
}

export default Sidebar