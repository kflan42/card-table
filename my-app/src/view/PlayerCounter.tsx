import React from 'react'

import './_style.css';

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
        <div>
            <span className="buttontooltip " style={{ cursor: "default" }}>
                {label} {value}
                <span className="buttontooltiptext">{props.kind}</span>
            </span>

            <span className="TextButton" onClick={() => up()}>▲</span>
            <span className="TextButton" onClick={() => down()}>▼</span>
        </div>
    )
}

export default PlayerCounter