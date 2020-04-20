import React from 'react'

import './_style.css';
import Card from './Card';
import { randchoice, randint, testDeck } from './CardDB';



const Battlefield: React.FC = () => {

    const listItems = []
    for (let n = 0; n < 12; n++){
        const name = randchoice(testDeck)
        listItems.push( <Card key={n}
            name={name}
            x={randint(8)*10+5} y={randint(8)*10+5}
            tapped={randchoice([true, false, false, false])}
            faceDown={randchoice([true, false, false, false])}
            transformed={name === "Nissa, Vastwood Seer" ? randchoice([true, false]) : undefined}
        />
        )
    };

    return (
        <div className="Battlefield">
            {listItems}
        </div>
    )
}

export default Battlefield