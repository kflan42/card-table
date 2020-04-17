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
                <Card name="Generated Horizons" />
                <Card name="Rampant Growth" />
                <Card name="Nissa, Vastwood Seer // Nissa, Sage Animist" />
                <Card name="Forest" />
                <Card name="Llanowar Elves" />
                <Card name="Lightning Greaves" />
                <Card name="Generated Horizons" />
                <Card name="Rampant Growth" />
                <Card name="Nissa, Vastwood Seer // Nissa, Sage Animist" />
            </div>
    )
}

export default Hand