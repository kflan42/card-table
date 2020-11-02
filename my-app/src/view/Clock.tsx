import React, { useState, useEffect } from "react";
import Die from "./Die";
import Help from "./Help";
import { OptionsDialog } from "./OptionsDialog";
import { useConfirmation } from "./ConfirmationService";
import { ConfirmationResult } from "./ConfirmationDialog";
import { ClientState } from "../ClientState";
import { useSelector } from "react-redux";
import { useRouteChanger } from './MyRouting'


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
  const sessionId = useSelector((state: ClientState) => state.sessionId)
  const routeChanger = useRouteChanger()
  const confirmation = useConfirmation();
  const leaveDialog = () => {
    const choices = ["Leave Table"]
    confirmation({
        choices,
        catchOnCancel: true,
        title: "Leave Table?",
        description: "You'll go to the room screen, but your deck will remain at the table."
    }).then((s: ConfirmationResult) => {
        switch(s.choice) {
            case "Leave Table":
                routeChanger(`/room?sessionId=${sessionId}`)
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
