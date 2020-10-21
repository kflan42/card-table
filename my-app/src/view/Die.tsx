import React from "react";
import { ConfirmationResult } from "./ConfirmationDialog";
import { RANDOMNESS } from "../Actions";
import { useConfirmation } from "./ConfirmationService";
import { usePlayerActions } from "../PlayerDispatch";


const Die: React.FC = () => {

  const {action:playerDispatch, baseAction} = usePlayerActions()
  const confirmation = useConfirmation()

  const rollPrompt = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    confirmation({
      choices: ["Coin Flip", "Roll d20", "Roll d _"],
      catchOnCancel: true,
      title: "Randomness",
      description: "",
      location: { x: event.clientX, y: event.clientY }
    })
      .then((s: ConfirmationResult) => {
        let line = ""
        switch (s.choice) {
          case "Coin Flip":
            line = s.choice
            break;
          case "Roll d20":
            line = s.choice
            break;
          case "Roll d _":
            line = `Roll d${s.n}`
            break;
        }
        playerDispatch({...baseAction(), kind:RANDOMNESS, message:line})
      })
      .catch(() => null);
  }

  /* eslint-disable jsx-a11y/accessible-emoji */
  return (
    <span style={{ cursor: "pointer" }} onClick={rollPrompt}>🎲</span>
  );
}

export default Die
