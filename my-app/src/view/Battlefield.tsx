import React from 'react'

import './myStyle.css';
import Card from './Card';
import Playmat from './Playmat';



const Battlefield: React.FC = () => {

    const cards = [
        "Forest",
        "Nissa, Vastwood Seer // Nissa, Sage Animist",
        "Llanowar Elves",
        "Lightning Greaves",
        "Generated Horizons",
        "Rampant Growth",
        "Zombie",
    ];

    function randint(m:number) {
        return Math.floor(Math.random()*m);
    }

    const listItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => {
        const randomCard = cards[randint(cards.length)];
        return <Card name={randomCard} x={randint(250)} y={randint(300)}></Card>
    });

    return (
        <div className="Battlefield">
            {listItems}
        </div>
    )
}

export default Battlefield