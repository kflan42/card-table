import Select, {ActionMeta} from 'react-select'
import React, {useState} from "react";
import CardDB from "../CardDB";


export interface ConfirmationOptions {
    catchOnCancel?: boolean;
    title: string;
    description: string;
    choices: string[];
    location?: { x: number, y: number }
}

export interface ConfirmationResult { choice: string, n: number, s: string }

interface ConfirmationDialogProps extends ConfirmationOptions {
    onSubmit: (c: ConfirmationResult) => void;
    onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    title,
    description,
    choices,
    location,
    onSubmit,
    onCancel,
}) => {

    // shift towards center to ensure user can see it
    const left = (location ? location.x : 0 + window.innerWidth / 2) / 2
    const top = (location ? location.y : 0 + window.innerHeight / 2) / 2

    const [valueN, setValueN] = useState(1)
    const [valueS, setValueS] = useState("")

    function selectChanged(value: any, actionMeta: ActionMeta<any>) {
        if (actionMeta.action === 'select-option') {
            setValueS(value.value as string)
        }
    }

    const elements = []
    for (const c of choices) {
        const parts = c.split(' ')
        const elementParts = []
        if (parts.indexOf('_') > -1 || parts.indexOf('*') > -1 || parts.indexOf('$') > -1) {
            // use first word as button, rest as label(s) for input field(s)
            elementParts.push(
                <button key={c}
                    style={{
                        marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em"
                    }}
                    onClick={() => onSubmit({ choice: c, n: valueN, s: valueS })}>
                    {parts[0]}
                </button>)
            parts.splice(0, 1)
            for (let i = 0; i < parts.length; i++) {
                let p = parts[i];
                switch (p) {
                    case '_':
                        elementParts.push(
                            <input className="DivButton" key={p}
                                style={{ marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em" }}
                                type="number" id="x" name="x" min="0" max="1000"
                                value={valueN} onChange={e => setValueN(e.currentTarget.valueAsNumber)} />)
                        break;
                    case '*':
                        elementParts.push(
                            <input className="DivButton" key={p}
                                style={{ marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em" }}
                                type="text" id="x" name="x" autoFocus={true}
                                value={valueS} onChange={e => setValueS(e.currentTarget.value)} />)
                        break;
                    case '$':
                        const options = CardDB.getTokenChoices().map((c: string) => ({value: c, label: c}))
                        const customStyles = {
                            option: (provided: object, state: object) => ({
                                ...provided
                            }),
                            control: () => ({minWidth: "20em", display: "flex"}),
                        }
                        elementParts.push(
                            <Select className="DivButton" key={p}
                                    style={{
                                        marginLeft: "0.5em",
                                        marginRight: "0.5em",
                                        marginTop: "1em",
                                        marginBottom: "1em"
                                    }}
                                    styles={customStyles}
                                    options={options}
                                    id="x" name="x" autoFocus={true}
                                    onChange={selectChanged}
                            />
                        )
                        break;
                    default:
                        elementParts.push(
                            <span key={p}>{p}</span>
                        )
                        break;
                }
            }
        } else {
            elementParts.push(
                <button key={c}
                    style={{
                        marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em"
                    }}
                    onClick={() => onSubmit({ choice: c, n: valueN, s: valueS })}>
                    {c}
                </button>)
        }
        elements.push(<div style={{
            display: "flex", alignItems:"center"
        }} key={c}>{elementParts}</div>)
    }
    elements.push(<div key={"Cancel"}>
        <button
            style={{
                marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em"
            }}
            onClick={() => onCancel()}>
            Cancel
                </button>
    </div>)


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
            <span><strong>{title}</strong></span>
            <span>{description}</span>
            {elements}
        </div>
    );
};
