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
        console.log(gameId, playerAction, new Date(playerAction.when).toLocaleTimeString())

        // todo use a socket.io room for the table name
        MySocket.get_socket().emit('player_action', playerAction)

        // todo bypass this server callback for local test game
        // Game call back on action will dispatch(playerAction)
    }

    return action
}