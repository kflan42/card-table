import {useDispatch, useSelector} from "react-redux";
import {ClientState} from "./ClientState";
import {useParams} from "react-router-dom";
import {PlayerAction} from "./Actions";
import MySocket from "./MySocket";


export function usePlayerDispatch() {
    const dispatch = useDispatch()

    const {gameId} = useParams()

    const playerName = useSelector((state: ClientState) => state.playerPrefs.name)

    function action(action: { type: string }) {
        const playerAction: PlayerAction = {...action, who: playerName, when: Date.now()}
        if (gameId === 'static_test') {
            dispatch(playerAction)
            // bypass server for local test game
        } else {
            console.log(gameId, playerAction, new Date(playerAction.when).toLocaleTimeString())
            MySocket.get_socket().emit('player_action', {...playerAction, table: gameId})
        }
    }

    return action
}