import React, { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { ClientState } from '../ClientState';
import { setUserPrefs } from '../Actions';

interface OptionsDialogProps {
    onClose: () => any
}

export const OptionsDialog: React.FC<OptionsDialogProps> = ({
    onClose
}) => {

    const left = window.innerWidth / 4
    const top = window.innerHeight / 4

    const currentPrefs = useSelector((state: ClientState) => {
        return state.playerPrefs;
    })
    const [prefs, setPrefs] = useState(currentPrefs)
    const dispatch = useDispatch()

    return (
        <div className="Popup" style={{
            left: left + "px",
            top: top + "px",
            backgroundColor: "white",
            border: "0.2em solid black",
            padding: "1em",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            <span><strong>Options</strong></span>
            <span>Configure stuff.</span>

            <div style={{
                display: "flex", alignItems: "center"
            }} key="BFCardHeight">
                Battlefield Card Height
                <input className="DivButton" key="BFCardHeight"
                    style={{ marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em" }}
                    type="number" id="x" name="x" min="0" max="1000"
                    value={prefs.bfCardSize} onChange={e => {
                        const bfCardSize = e.currentTarget.valueAsNumber
                        setPrefs({ ...prefs, bfCardSize })
                    }} />
            </div>

            <div style={{
                display: "flex", alignItems: "center"
            }} key="CardHeight">
                Hand Card Height
                <input className="DivButton" key="CardHeight"
                    style={{ marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em" }}
                    type="number" id="x" name="x" min="0" max="1000"
                    value={prefs.handCardSize} onChange={e => {
                        const handCardSize = e.currentTarget.valueAsNumber
                        setPrefs({ ...prefs, handCardSize })
                    }} />
            </div>

            <div style={{
                display: "flex", alignItems: "center"
            }} key="close">
                <button
                    style={{
                        marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em"
                    }}
                    onClick={() => onClose()}>
                    Cancel
                </button>
                <button
                    style={{
                        marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em"
                    }}
                    onClick={() => {
                        dispatch(setUserPrefs(prefs))
                        localStorage.setItem('bfCardSize', ''+prefs.bfCardSize)
                        localStorage.setItem('handCardSize', ''+prefs.handCardSize)
                        onClose()
                    }}>
                    Ok
                </button>
            </div>

        </div>
    );
};
