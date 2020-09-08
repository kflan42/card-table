import React from "react";
import { ConfirmationResult } from "./ConfirmationDialog";
import { MESSAGE } from "../Actions";
import { useConfirmation } from "./ConfirmationService";
import { randchoice, randint } from "../Utilities";
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
            line = `Coin flip is ${randchoice(["Heads", "Tails"])}`
            break;
          case "Roll d20":
            line = `Rolled a ${randint(20) + 1} on a d20`
            break;
          case "Roll d _":
            line = `Rolled a ${randint(s.n) + 1} on a d${s.n}`
            break;
        }
        playerDispatch({...baseAction(), kind:MESSAGE, message:line})
        // TODO move random stuff to server to avoid client side hacking
      })
      .catch(() => null);
  }

  /* eslint-disable jsx-a11y/accessible-emoji */
  return (
    <span style={{ cursor: "pointer" }} onClick={rollPrompt}>🎲</span>
  );
}

export default Die
