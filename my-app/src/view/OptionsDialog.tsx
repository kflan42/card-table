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
            }} key="rightClickPopup">
                <p>Right-Click to toggle Card Popup. 
                <input className="DivButton"
                    style={{ marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em" }}
                    type="checkbox" id="x" name="x"
                    checked={prefs.rightClickPopup} onChange={e => {
                        const rightClickPopup = e.currentTarget.checked
                        setPrefs({ ...prefs, rightClickPopup })
                    }} />
                    <br/>
                    <i> Ctrl + Right-Click to see other side of card.</i></p>
            </div>

            <div style={{
                display: "flex", alignItems: "center"
            }} key="bfImageSize">
                Use "small" Battlefield Card Images (Sometimes Less Fuzzy)
                <input className="DivButton"
                    style={{ marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em" }}
                    type="checkbox" id="x" name="x"
                    checked={prefs.bfImageSize === "small"} onChange={e => {
                        const bfImageSize = e.currentTarget.checked ? "small" : "normal"
                        setPrefs({ ...prefs, bfImageSize })
                    }} />
            </div>

            <div style={{
                display: "flex", alignItems: "center"
            }} key="bfCardSize">
                Battlefield Card Height
                <input className="DivButton"
                    style={{ marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em" }}
                    type="number" id="x" name="x" min="0" max="1000"
                    value={prefs.bfCardSize} onChange={e => {
                        const bfCardSize = e.currentTarget.valueAsNumber
                        setPrefs({ ...prefs, bfCardSize })
                    }} />
            </div>

            <div style={{
                display: "flex", alignItems: "center"
            }} key="handCardSize">
                Hand Card Height
                <input className="DivButton"
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
                        localStorage.setItem('rightClickPopup', '' + prefs.rightClickPopup)
                        localStorage.setItem('bfImageSize', prefs.bfImageSize)
                        localStorage.setItem('bfCardSize', '' + prefs.bfCardSize)
                        localStorage.setItem('handCardSize', '' + prefs.handCardSize)
                        onClose()
                    }}>
                    Ok
                </button>
            </div>

        </div>
    );
};
