import React from 'react'

import './myStyle.css';

interface PlayerCounterP {
    kind: string
}


const PlayerCounter: React.FC<PlayerCounterP> = (props) => {

    const label = props.kind === "Life" ? "❤️" : props.kind;
    const value = 40;

    function up() {
        console.log(props.kind + " up")
    }

    function down() {
        console.log(props.kind + " down")
    }

    return (
        <div className="PlayerCounter"
            style={{
                display: "flex"
            }}>
            <div className="tooltip">
                {label} {value}
                <span className="tooltiptext">{props.kind}</span>
            </div>

            <div className="TextButton" onClick={() => up()}>▲</div>
            <div className="TextButton" onClick={() => down()}>▼</div>
        </div>
    )
}

export default PlayerCounter