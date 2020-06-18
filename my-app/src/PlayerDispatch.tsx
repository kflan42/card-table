import { useDispatch, useSelector } from "react-redux";
import { ClientState } from "./ClientState";
import { useParams } from "react-router-dom";
import { PlayerAction } from "./Actions";
import MySocket from "./MySocket";
import { useState } from "react";


export function usePlayerDispatch() {
    const dispatch = useDispatch()

    const { gameId } = useParams()

    const playerName = useSelector((state: ClientState) => state.playerPrefs.name)

    const [outstanding, setOutstanding] = useState(0)

    function send(playerAction: PlayerAction, eventName: string) {
        if (gameId === 'static_test') {
            dispatch(playerAction)
        } else {
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
                if (ack) {
                    dispatch(playerAction)
                }
            })
        }
    }

    function action(action: { type: string }) {
        const playerAction: PlayerAction = { ...action, who: playerName, when: Date.now() }
        send(playerAction, 'player_action');
    }

    function draw(action: { type: string }) {
        const playerDraw = { ...action, who: playerName, when: Date.now() }
        send(playerDraw, 'player_draw');
    }

    return { action, draw }
}