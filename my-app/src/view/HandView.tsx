import React from 'react'

import './MyStyles.css';

export interface HandViewState {

}

const HandView: React.FC<HandViewState> = ({}) => {

    return (
        <>
        <div className="HandView">
            <h1>HandView</h1>
        </div>
        </>
    )
}

export default HandView