import React, { useState, useEffect } from "react";
import Die from "./Die";
import Help from "./Help";


const Clock: React.FC = () => {

  const timerID = setInterval(
    () => tick(),
    1000
  );
  const [state, setState] = useState({ date: new Date() })


  useEffect(() => {
    return function cleanup() {
      if (timerID)
        clearInterval(timerID);
    }
  })

  const tick = () => {
    setState({
      date: new Date()
    });
  }

  /* eslint-disable jsx-a11y/accessible-emoji */
  return (
    <div style={{
      padding: "0.1em",
      color: "black",
      textAlign: "center",
      display: "flex",
      justifyContent: "space-around"
    }}>
      <Die />
      {state.date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      })}
      <Help />
    </div>
  );
}

const MemoizedClock = React.memo(Clock)
export default MemoizedClock
