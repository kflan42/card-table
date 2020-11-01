import { useSelector } from "react-redux";
import { ClientState } from "./ClientState";
import MySocket from "./MySocket";
import { useState } from "react";
import { PlayerAction } from "./magic_models";

class QueuedActions {
    private static queuedMoves:PlayerAction[] = []

    static queueMove(moveAction: PlayerAction) {
        this.queuedMoves.push(moveAction)
    }

    static takeMoves(): PlayerAction|null {
        if(this.queuedMoves.length === 0) {
            return null
        }
        // coalesce and send any queued moves
        const queuedAction = this.queuedMoves.reduce( (p,c) => {
            if(p) {
                p.card_moves = p.card_moves.concat(c.card_moves)
                return p
            } else {
                return c; // base case
            }
        })
        this.queuedMoves = []
        return queuedAction
    }
}


export function usePlayerActions() {

    const playerName = useSelector((state: ClientState) => state.playerPrefs.name)
    const [gameId, sessionId] = useSelector((state: ClientState) => [state.gameId, state.sessionId])

    const [outstanding, setOutstanding] = useState(0)

    function sendOverSocket(playerAction: PlayerAction, eventName: string) {

        const d = {
            session: sessionId as string,    
            table: gameId as string, 
            action: playerAction
        }

        // browsers limit http calls per domain to 6, and we've got 1 socket open for updates
        if (outstanding >= 5) {
            console.warn("too many actions outstanding, dropping this one")
            window.alert("Your last actions haven't resolved yet, please wait and retry.")
            return
        }
        setOutstanding(outstanding + 1)
        console.log(`sending`, d)
        MySocket.get_socket().emit(eventName, d, (ack: boolean) => {
            console.log('got ack for action at', playerAction.when, ack)
            setOutstanding(outstanding - 1)
        })

    }

    function baseAction(): PlayerAction {
        return {
            kind: "", who: playerName, when: Date.now(),
            message: "", card_moves: [], card_changes: [], counter_changes: [], create_tokens: []
        }
    }

    function sendAction(action: PlayerAction) {
        const queuedAction = QueuedActions.takeMoves()
        if (queuedAction) {
            sendOverSocket({ ...queuedAction, who: playerName, when: Date.now() }, 'player_action');
        }
        // then send this action
        sendOverSocket({ ...action, who: playerName, when: Date.now() }, 'player_action');
    }

    function queue(moveAction: PlayerAction) {
        QueuedActions.queueMove(moveAction)
    }

    function sendInfo(event: string, infoAction: { type: string }) {
        const playerInfo = { ...infoAction, who: playerName, when: Date.now() }
        console.log(`sending to ${gameId}`, playerInfo, new Date(playerInfo.when).toLocaleTimeString())
        const d = { ...playerInfo, session: sessionId, table: gameId };
        MySocket.get_socket().emit(event, d, (ack: boolean) => {
            console.log('got ack for ', playerInfo, ack)
        })
    }

    return { action: sendAction, queue: queue, info: sendInfo, baseAction }
}