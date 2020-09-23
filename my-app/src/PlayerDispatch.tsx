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
    const gameId = useSelector((state: ClientState) => state.gameId)

    const [outstanding, setOutstanding] = useState(0)

    function sendOverSocket(playerAction: PlayerAction, eventName: string) {

        // browsers limit http calls per domain to 6, and we've got 1 socket open for updates
        if (outstanding >= 5) {
            console.warn("too many actions outstanding, dropping this one")
            window.alert("Your last actions haven't resolved yet, please wait and retry.")
            return
        }
        setOutstanding(outstanding + 1)
        console.log(`sending`, playerAction)
        MySocket.get_socket().emit(eventName, { ...playerAction, table: gameId }, (ack: boolean) => {
            console.log('got ack for action at', playerAction.when, ack)
            setOutstanding(outstanding - 1)
        })

    }

    function baseAction(): PlayerAction {
        return {
            table: gameId as string, kind: "", who: playerName, when: Date.now(),
            message: "", card_moves: [], card_changes: [], counter_changes: [], create_tokens: []
        }
    }

    function send(action: PlayerAction) {
        const queuedAction = QueuedActions.takeMoves()
        if (queuedAction) {
            sendOverSocket({ ...queuedAction, table: gameId as string, who: playerName, when: Date.now() }, 'player_action');
        }
        // then send this action
        sendOverSocket({ ...action, table: gameId as string, who: playerName, when: Date.now() }, 'player_action');
    }

    function queue(moveAction: PlayerAction) {
        QueuedActions.queueMove(moveAction)
    }

    function draw(action: { type: string }) {
        const playerDraw = { ...action, who: playerName, when: Date.now() }
        console.log(`sending to ${gameId}`, playerDraw, new Date(playerDraw.when).toLocaleTimeString())
        MySocket.get_socket().emit('player_draw', { ...playerDraw, table: gameId }, (ack: boolean) => {
            console.log('got ack for ', playerDraw, ack)
        })
    }

    return { action: send, queue: queue, draw, baseAction }
}