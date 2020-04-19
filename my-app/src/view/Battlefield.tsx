import React from 'react'

import './myStyle.css';
import Card from './Card';
import { randchoice, randint } from './CardDB';



const Battlefield: React.FC = () => {

    const cards = [
        "Forest",
        "Nissa, Vastwood Seer",
        "Llanowar Elves",
        "Lightning Greaves",
        "Armored Ascension",
        "Rampant Growth",
        "Zombie",
    ];

    const listItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => {
        const name = randchoice(cards)
        return <Card key={n}
            name={name}
            x={randint(9)*10} y={randint(9)*10}
            tapped={randchoice([true, false, false, false])}
            faceDown={randchoice([true, false, false, false])}
            transformed={name === "Nissa, Vastwood Seer" ? randchoice([true, false]) : undefined}
        />
    });

    return (
        <div className="Battlefield">
            {listItems}
        </div>
    )
}

export default Battlefield