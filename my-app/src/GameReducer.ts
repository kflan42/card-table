import {
    GameUpdate,
    SET_GAME,
    UPDATE_GAME,
} from './Actions'
import {Game, indexGame} from './ClientState'

export function gameReducer(
    state: Game = {
        players: {},
        cards: {},
        zones: {},
        battlefieldCards: {},
        tableCards: {},
        actionLog: [],
    },
    gameUpdate: GameUpdate
) {

    let newState: Game = state 

    switch (gameUpdate.type) {
        case SET_GAME:
            let indexedGame = indexGame(gameUpdate.game, gameUpdate.tableCards, gameUpdate.logLines);
            newState = indexedGame
            console.log('applied', gameUpdate)
            break
        case UPDATE_GAME:
            let indexedUpdates = indexGame(gameUpdate.game, gameUpdate.tableCards, gameUpdate.logLines);
            newState.players = {...newState.players, ...indexedUpdates.players}
            newState.cards = {...newState.cards, ...indexedUpdates.cards}
            newState.battlefieldCards = {...newState.battlefieldCards, ...indexedUpdates.battlefieldCards}
            newState.zones = {...newState.zones, ...indexedUpdates.zones}
            newState.tableCards = {...newState.tableCards, ...indexedUpdates.tableCards}
            newState.actionLog = [...newState.actionLog, ...indexedUpdates.actionLog]
            break
    }

    return newState

}
