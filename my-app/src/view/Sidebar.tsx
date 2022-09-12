import React, { useEffect, useState } from 'react'

import './_style.css';
import Clock from './Clock';
import Log from './Log';
import { useSelector } from 'react-redux';
import { ClientState } from '../ClientState';
import { useRouteChanger } from './MyRouting';



const Sidebar: React.FC = () => {

    const routeChanger = useRouteChanger()

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

    const [loadTime, setLoadTime] = useState(0)

    useEffect(()=> {
        if(loadTime === 0) {
        setLoadTime(new Date().getTime() / 1000)
        }
    }, [loadTime]);

    const logLines = useSelector((state: ClientState) => state.game.actionLog)
    const elapsedS = logLines.length > 0 
        ? Math.floor((state.date.getTime() - logLines[logLines.length - 1].when) / 1000)
        : 0

    const tick = () => {
        setState({
            date: new Date()
        });
        const ageS = new Date().getTime() / 1000 - loadTime
        if(elapsedS > 900 &&  ageS > 180) {
            routeChanger('.')  // leave game and close socket so api server will spin down
        }
    }


    const tooLong = elapsedS > 45
    const flash = elapsedS % 5 < 3
    const whoseTurn = useSelector((state: ClientState) => state.whoseTurn)

    return (
        <div className="Log">
            <Clock></Clock>
            <Log></Log>
            <div style={{
                margin: "0.1em",
                fontWeight: "bold",
                color: tooLong ? "red" : undefined
            }}>
                {tooLong && flash ? `... waited ${elapsedS} seconds!` :
                    whoseTurn ? `${whoseTurn}'s turn` : null}
            </div>
        </div>
    )
}

export default Sidebar