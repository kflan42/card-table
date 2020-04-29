import * as React from "react";

export interface ConfirmationOptions {
    catchOnCancel?: boolean;
    title: string;
    description: string;
    choices: string[];
    location: { x: number, y: number }
}

interface ConfirmationDialogProps extends ConfirmationOptions {
    onSubmit: (c: string) => void;
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


    return (
        <div className="Popup" style={{
            left: left + "px",
            top: top + "px",
            backgroundColor: "white",
            border: "0.2em solid black",
            padding: "1em"
        }}>
            <span><strong>{title}</strong></span>
            <div>
                <span>{description}</span>
            </div>
            <div>
                {choices.map(c =>
                    <button
                        key={c}
                        style={{ backgroundColor: "LightGray", margin: "1em", }}
                        onClick={() => onSubmit(c)}>
                        {c}
                    </button>)}
            </div>
        </div>
    );
};
