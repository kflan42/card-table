import React, { useState, useEffect } from "react";
import Die from "./Die";


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
      textAlign: "center"
    }}>
      <Die />
      {state.date.toLocaleTimeString()}
    </div>
  );
}

export default Clock
