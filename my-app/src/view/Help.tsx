import React from "react";

const Help: React.FC = () => {

    /* eslint-disable jsx-a11y/accessible-emoji */
    return (
        <div className="dropdown">
            <span>&nbsp;❔&nbsp;</span>
            <div className="dropdown-content" style={{
                backgroundColor: 'white',
                top: '100%',
                right: 0,
                width: '40em',
                textAlign: 'start',
                padding:'1em',
            }}>
                <p>Drag and drop cards for most things. Click on a card to tap/untap it.</p>
                <p>Keyboard actions:</p>
                <table>
                    <thead >
                        <tr><th style={{textAlign:"start"}}><b>key</b></th><th style={{textAlign:"start"}}>action</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><b>a</b></td><td>then click two times to draw a line from a card/player to a card/player</td></tr>
                        <tr><td><b>A</b></td><td>clear your lines</td></tr>
                        <tr><td><b>c</b></td><td>create a counter on a card</td></tr>
                        <tr><td><b>C</b></td><td>create a token card, can choose to copy if cursor is over a card</td></tr>
                        <tr><td><b>B</b></td><td>put card on bottom of Library</td></tr>
                        <tr><td><b>G</b></td><td>put card in Graveyard</td></tr>
                        <tr><td><b>E</b></td><td>put card in Exile</td></tr>
                        <tr><td><b>D</b></td><td>draw a card</td></tr>
                        <tr><td><b>M</b></td><td>mulligan dialog</td></tr>
                        <tr><td><b>F</b></td><td>flip a card facedown (or up)</td></tr>
                        <tr><td><b>T</b></td><td>transform a card (if two sided)</td></tr>
                        <tr><td><b>U</b></td><td>untap all your tapped cards</td></tr>
                        <tr><td><b>v</b></td><td>view a close up popup of the card under the cursor, then v to close</td></tr>
                        <tr><td><b>H</b></td><td>open a dialog to hide a player (or show a hidden one)</td></tr>
                        <tr><td><b>O</b></td><td>open the options dialog</td></tr>
                    </tbody>
                </table>
                <p>Click on the table to focus input there then press the key.</p>
                <p>Click on the 🎲 to simulate die rolls or coin flips.</p>
                <p>Click on the ➕ to add a Player Counter such as Poison or Commander Damage.</p>
            </div>
        </div>
    );
}

export default Help
