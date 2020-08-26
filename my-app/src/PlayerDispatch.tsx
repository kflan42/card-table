import { useDispatch, useSelector } from "react-redux";
import { ClientState } from "./ClientState";
import { useParams } from "react-router-dom";
import MySocket from "./MySocket";
import { useState } from "react";
import { PlayerAction } from "./magic_models";


export function usePlayerActions() {
    const dispatch = useDispatch()

    const { gameId } = useParams()

    const playerName = useSelector((state: ClientState) => state.playerPrefs.name)

    const [outstanding, setOutstanding] = useState(0)

    function sendOverSocket(playerAction: PlayerAction, eventName: string) {

        if (outstanding > 7) {
            console.warn("too many actions outstanding, dropping this one")
            window.alert("Your last actions haven't resolved yet, please wait and retry.")
            return
        }
        setOutstanding(outstanding + 1)
        console.log(`sending to ${gameId}`, playerAction, new Date(playerAction.when).toLocaleTimeString())
        MySocket.get_socket().emit(eventName, { ...playerAction, table: gameId }, (ack: boolean) => {
            console.log('got ack for ', playerAction, ack)
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
        sendOverSocket({ ...action, table: gameId as string, who: playerName, when: Date.now() }, 'player_action');
    }

    function draw(action: { type: string }) {
        const playerDraw = { ...action, who: playerName, when: Date.now() }
        if (gameId === 'static_test') {
            dispatch(playerDraw)
        } else {
            console.log(`sending to ${gameId}`, playerDraw, new Date(playerDraw.when).toLocaleTimeString())
            MySocket.get_socket().emit('player_draw', { ...playerDraw, table: gameId }, (ack: boolean) => {
                console.log('got ack for ', playerDraw, ack)
                if (ack) {
                    dispatch(playerDraw)
                }
            })
        }
    }

    return { action: send, draw, baseAction }
}