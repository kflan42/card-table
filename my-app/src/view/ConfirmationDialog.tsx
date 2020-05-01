import * as React from "react";

export interface ConfirmationOptions {
    catchOnCancel?: boolean;
    title: string;
    description: string;
    choices: string[];
    location: { x: number, y: number }
}

interface ConfirmationDialogProps extends ConfirmationOptions {
    onSubmit: (c: [string, number?]) => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    title,
    description,
    choices,
    location,
    onSubmit,
}) => {

    // shift towards center to ensure user can see it
    const left = (location.x + window.innerWidth / 2) / 2
    const top = (location.y + window.innerHeight / 2) / 2

    // can use 1 input thing
    const [value, setValue] = React.useState(1)

    const elements = []
    for (const c of choices) {
        const blankFirst = c.startsWith("_")
        const blankLast = c.endsWith("_")
        if (blankFirst || blankLast) {
            const label = c.split('_').join('')
            const blank = <input className="DivButton"
                style={{ marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em" }}
                type="number" id="x" name="x" min="0" max="1000"
                value={value} onChange={e => setValue(e.currentTarget.valueAsNumber)} />
            elements.push(<div key={label}>
                {blankFirst ? blank : null}
                <button
                    style={{
                        marginLeft: "0.5em", marginRight: "0.5em", marginTop: "1em", marginBottom: "1em"
                    }}
                    onClick={() => onSubmit([c, value])}>
                    {label}
                </button>
                {blankLast ? blank : null}
            </div >)
        } else {
            elements.push(
                <button key={c}
                    style={{ margin: "1em", width: "80%" }}
                    onClick={() => onSubmit([c, undefined])}>
                    {c}
                </button>
            )
        }
    }


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
