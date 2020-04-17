import React from 'react'

import './myStyle.css';
import Card from './Card';



const Table: React.FC = () => {
    
    return (
        <div className="Table">
            {/* todo put cards in zones on table*/}
            <Card name="Zombie"></Card>
        </div>
    )
}

export default Table