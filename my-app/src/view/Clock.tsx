import React, { useState, useEffect } from "react";
import Die from "./Die";
import Help from "./Help";
import { OptionsDialog } from "./OptionsDialog";
import { useConfirmation } from "./ConfirmationService";
import { ConfirmationResult } from "./ConfirmationDialog";
import { useHistory } from "react-router-dom";


const Clock: React.FC = () => {

  const [state, setState] = useState({ date: new Date() })

  const timerID = setInterval(
    () => tick(),
    1000
  );

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

  const [optionsOpen, setOptionsOpen] = useState(false)

  const history = useHistory()
  const confirmation = useConfirmation();
  const leaveDialog = () => {
    const choices = ["Go to Login Screen"]
    confirmation({
        choices,
        catchOnCancel: true,
        title: "Go back to Login Screen?",
        description: "But your deck will remain at the table."
    }).then((s: ConfirmationResult) => {
        switch(s.choice) {
            case "Go to Login Screen":
                history.push('/login')
            break;
        }
    }).catch(()=>null)
}

  /* eslint-disable jsx-a11y/accessible-emoji */
  return (
    <div style={{
      padding: "0.1em",
      color: "black",
      borderBottom: "solid black 0.1em",
      textAlign: "center",
      display: "flex",
      justifyContent: "space-around"
    }}>
      {state.date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      })}

      <Die />

      <span style={{ cursor: "pointer" }} onClick={() => setOptionsOpen(true)}>⚙️</span>
      {optionsOpen ? <OptionsDialog onClose={() => setOptionsOpen(false)} /> : undefined}

      <Help />

      <span style={{ cursor: "pointer" }} onClick={() => leaveDialog()}>🚪</span>
    </div>
  );
}

const MemoizedClock = React.memo(Clock)
export default MemoizedClock
