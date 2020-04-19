import React from 'react'

import './myStyle.css';
import Card from './Card';


const Hand: React.FC = () => {

    return (
            <div className="Hand" style={{
            }}>
                <p>Hand</p>

                <Card name="Forest" />
                <Card name="Llanowar Elves" />
                <Card name="Lightning Greaves" />
                <Card name="Armored Ascension" />
                <Card name="Rampant Growth" />
                <Card name="Nissa, Vastwood Seer" />
                <Card name="Forest" />
                <Card name="Llanowar Elves" />
                <Card name="Lightning Greaves" />
                <Card name="Rampant Growth" />
                <Card name="Nissa, Vastwood Seer" />
            </div>
    )
}

export default Hand