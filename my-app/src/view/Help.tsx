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
                        <tr><th style={{textAlign:"start"}}><b>key</b></th><th style={{textAlign:"start"}}>&nbsp;action</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><b>a</b></td><td>to draw a line from your 1st click on a card/player to your 2nd click on a card/player</td></tr>
                        <tr><td><b>A</b></td><td>clear your lines</td></tr>
                        <tr><td><b>n</b></td><td>pass turn to next player</td></tr>
                        <tr><td></td><td>----</td></tr>
                        <tr><td><b>D</b></td><td>draw a card</td></tr>
                        <tr><td><b>M</b></td><td>mulligan dialog</td></tr>
                        <tr><td><b>c</b></td><td>create a counter on a card</td></tr>
                        <tr><td><b>C</b></td><td>create a token card, can choose to copy if cursor is over a card</td></tr>
                        <tr><td><b>B</b></td><td>put card on bottom of Library</td></tr>
                        <tr><td><b>G</b></td><td>put card in Graveyard</td></tr>
                        <tr><td><b>E</b></td><td>put card in Exile</td></tr>
                        <tr><td><b>F</b></td><td>turn a card facedown (or up)</td></tr>
                        <tr><td><b>R</b></td><td>rotate a card 180 degrees (e.g. a Flip card)</td></tr>
                        <tr><td><b>T</b></td><td>transform or turn over a two-side card</td></tr>
                        <tr><td><b>U</b></td><td>untap all your tapped cards</td></tr>
                        <tr><td></td><td>----</td></tr>
                        <tr><td><b>^</b></td><td>vote to reset the game, counters and tokens will vanish and cards not in sideboard will go to library</td></tr>
                        <tr><td><b>v</b></td><td>view a large popup of the card under the cursor, press again to close</td></tr>
                        <tr><td><b>H</b></td><td>hide a player (or show a hidden one) via a dialog</td></tr>
                        <tr><td><b>O</b></td><td>open the options dialog to configure stuff</td></tr>
                    </tbody>
                </table>
                <p>Click on the table to focus input there then press the key.</p>
                <p>Click on the 🎲 to simulate die rolls or coin flips.</p>
                <p>Click on the ➕ to add a Player Counter such as Poison or Commander Damage.</p>
            </div>
        </div>
    );
}

const MemoizeHelp = React.memo(Help)
export default MemoizeHelp
