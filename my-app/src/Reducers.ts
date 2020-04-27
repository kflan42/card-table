import { combineReducers } from 'redux'

import update from 'immutability-helper'


import {
    TOGGLE_TAP_CARD,
    LOCAL_STATE_LOAD,
    REORDER_HAND,
    HOVERED_CARD,
    MOVE_CARD,
    MoveCard
} from './Actions'
import { Game, HAND } from './ClientState'
import { createTestGame } from './zzzState'


// TODO generalize actions to cover counters etc
function gameReducer(state: Game = createTestGame(), action: any) {
    let newState = null
    switch (action.type) {
        case TOGGLE_TAP_CARD:
            const bfId = action.bfId
            newState = update(state, { battlefieldCards: { [bfId]: { $toggle: ['tapped'] } } })
            break;
        case REORDER_HAND:
            // update(cards, {
            //     $splice: [
            //         [index, 1],
            //         [toIndex, 0, card],
            //     ],
            // }),
            const zoneId = state.players[action.owner].zones[HAND]
            newState = update(state, {
                zones: {
                    [zoneId]: {
                        cards: {
                            $splice: [
                                [action.fromIndex, 1],
                                [action.toIndex, 0, action.cardId],
                            ]
                        }
                    }
                }
            })
            break;
        case MOVE_CARD:
            const moveCard = action as MoveCard
            if (moveCard.srcOwner === moveCard.tgtOwner && moveCard.srcZone === moveCard.tgtZone) {
                // easy case, not changing zones
                if (moveCard.bfId) {
                    // moving battlefied card
                    newState = update(state, { battlefieldCards: { [moveCard.bfId]: { $merge: { x: moveCard.toX, y: moveCard.toY, changed: moveCard.when } } } })
                }
            } else if (moveCard.srcOwner !== moveCard.tgtOwner && moveCard.srcZone === moveCard.tgtZone && moveCard.bfId) {
                const srcBfCardIdx = state.battlefields[moveCard.srcOwner].battlefieldCards.indexOf(moveCard.bfId)
                // moving card, removing from src, adding to tgt battlefields
                newState = update(state, { battlefieldCards: { [moveCard.bfId]: { $merge: { x: moveCard.toX, y: moveCard.toY, changed: moveCard.when } } } })
                newState = update(newState, { battlefields: { [moveCard.srcOwner]: { battlefieldCards: { $splice: [[srcBfCardIdx, 1]] } } } })
                newState = update(newState, { battlefields: { [moveCard.tgtOwner]: { battlefieldCards: { $push: [moveCard.bfId] } } } })
            }
            break;
        default:
            //ignored
            break;
    }
    if (newState) {
        console.log(`applied `, action)
        return newState
    }
    return state
}

const stateReducer = combineReducers({
    playerPrefs: (x = { name: undefined, color: undefined }, y) => {
        if (y.type === LOCAL_STATE_LOAD) return y.payload;
        else return x;
    },
    game: gameReducer,
    cardUnderCursor: (x = null, y) => {
        if (y.type === HOVERED_CARD) return y.cardId;
        else return x;
    },
})

export default stateReducer