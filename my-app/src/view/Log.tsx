import React from 'react'

import './_style.css';
import { Clock } from './Clock';



const Log: React.FC = () => {

    let logLines = "hello world";

    for (let index = 0; index < 100; index++) {
        logLines = `${logLines}\n${index} alice did a thing`

    }

    return (
        <div className="Log">
            <Clock></Clock>
            <textarea style={{
                flexGrow: 1
            }}
                value={logLines}
                readOnly={true}
            ></textarea>
        </div>
    )
}

export default Log