import React, { ChangeEvent, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom';
import MySocket from '../MySocket';
import { safeString } from '../Utilities';


export const SessionForm: React.FC = () => {
    const history = useHistory()
    const [sessionId, setSessionId] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        MySocket.close_socket() // disconnect handlers or connections if we left a game
        const savedSessionId = localStorage.getItem('sessionId')
        if (savedSessionId) {
            setSessionId(savedSessionId)
        }
    }, [])

    const onSessionIdChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newS = safeString(event.target.value);
        setSessionId(newS)
        if (sessionId.length >= 5) {
            setErrorMsg('')
        }
    }

    const onEnter = (event: React.FormEvent) => {
        event.preventDefault();
        if (sessionId.length < 5) {
            setErrorMsg("Please enter a longer Session Id.")
            return
        }
        localStorage.setItem('sessionId', sessionId)
        history.push('/room?sessionId=' + sessionId)
    }

    return (
        <div className="myform" style={{ display: "flex", alignItems: "center" }}>
            <form className="FormBox" style={{ gridTemplateColumns: "auto auto auto" }} onSubmit={onEnter}>
                <span style={{ gridColumn: "1/4", textAlign: "center" }}> Where are you going, planeswalker? </span>
                <span style={{ alignSelf: "center" }}>Room: </span>
                <input type="text" value={sessionId} onChange={onSessionIdChange} style={{ width: "10em" }} />
                <input type="submit" className="DivButton" style={{ marginRight: "1em" }} value="Enter"></input>
                <span style={{ gridColumn: "1/4", color: "red", textAlign: "center" }}> {errorMsg ? errorMsg : null} </span>
            </form>
        </div>
    )
}

export default SessionForm
