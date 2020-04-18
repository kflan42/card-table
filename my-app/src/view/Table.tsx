import React from 'react'

import './myStyle.css';
import Card from './Card';
import Playmat from './Playmat';



const Table: React.FC = () => {
    
    return (
        <div className="Table">
            <Playmat player = "alice"/>
            <Playmat player = "bob"/>
            <Playmat player = "chad"/>
            <Playmat player = "dude"/>
            <Playmat player = "erwin"/>
        
            
        </div>
    )
}

export default Table