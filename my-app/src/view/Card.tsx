import React from 'react'

import './myStyle.css';

interface CardProps {
    name: string
}

const Card: React.FC<CardProps> = (props) => {


    // small is 10.8k (memory cache after 1st). fuzzy text, hard to read
    // normal is 75.7k (memory cache after 1st). readable
    const urls: {[index:string] : string} =
    {
       "Forest": "https://img.scryfall.com/cards/normal/front/e/d/ed6ff6d7-b976-413b-b433-8ebd2f3c2a54.jpg?1576267502",
        "Llanowar Elves": "https://img.scryfall.com/cards/normal/front/5/7/57ebd34e-dfe1-4093-a302-db395047a546.jpg?1573514034",
        "Lightning Greaves": "https://img.scryfall.com/cards/normal/front/e/f/ef5c570d-e415-4ac3-b48f-574ce109303a.jpg?1573517228",
        "Generated Horizons": "https://img.scryfall.com/cards/normal/front/d/c/dc1ab4f1-5458-46a6-9497-4136d04eb247.jpg?1576467445",
        "Rampant Growth": "https://img.scryfall.com/cards/normal/front/8/0/8010cf03-754f-40db-805a-842d791aa4b7.jpg?1573514345",
        // todo back side "https://img.scryfall.com/cards/normal/front/6/3/63b2b7cd-a51d-4e50-b794-a52731196973.jpg?1562702090"
        "Nissa, Vastwood Seer // Nissa, Sage Animist":"https://img.scryfall.com/cards/normal/front/6/3/63b2b7cd-a51d-4e50-b794-a52731196973.jpg?1562702090",
        "Zombie": "https://img.scryfall.com/cards/normal/front/3/e/3e8a0b96-9add-406a-bf10-bc943141edf5.jpg?1586453313"
    }
    return (
        <>
            <div
                className="Card"
                // todo later: border = owner sleeve color
                style={{
                    backgroundImage: 'url("' + urls[props.name] + '")',
                    backgroundSize: 'contain',
                    backgroundRepeat: "no-repeat"
                    
                }}
                >
                <p>{props.name}</p>
            </div>
        </>
    )
}

export default Card