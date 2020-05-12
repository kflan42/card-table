import { useDispatch, useSelector } from "react-redux";
import { ClientState } from "./ClientState";
import { useParams } from "react-router-dom";
import { PlayerAction } from "./Actions";


export function usePlayerDispatch() {
    const dispatch = useDispatch()

    const { gameId } = useParams()

    const playerName = useSelector((state: ClientState) => state.playerPrefs.name)

    function action(action: { type: string }) {
        const playerAction: PlayerAction = { ...action, who: playerName, when: Date.now() }
        console.log(gameId, playerAction, new Date(playerAction.when).toLocaleTimeString())
        dispatch(playerAction)
    }

    return action
}