import { combineReducers } from 'redux'

import update from 'immutability-helper'


import {
    TOGGLE_TAP_CARD,
    LOCAL_STATE_LOAD,
    HOVERED_CARD,
    HOVERED_BFCARD,
    MOVE_CARD,
    MoveCard,
    TOGGLE_TRANSFORM_CARD,
    TOGGLE_FACEDOWN_CARD
} from './Actions'
import { Game, HAND, BATTLEFIELD, BattlefieldCard, HoveredCard } from './ClientState'
import { createTestGame } from './zzzState'


// TODO generalize actions to cover counters etc
function gameReducer(state: Game = createTestGame(), action: { type: string, id: number } | MoveCard) {
    let newState = state
    const cardAction = action as { type: string, id: number }
    switch (action.type) {
        case MOVE_CARD:
            newState = handleMoveCard(state, action as MoveCard)
            break;
        case TOGGLE_TAP_CARD:
            newState = update(state, { battlefieldCards: { [cardAction.id]: { $toggle: ['tapped'] } } })
            break;
        case TOGGLE_TRANSFORM_CARD:
            newState = update(state, { cards: { [cardAction.id]: { $toggle: ['transformed'] } } })
            break;
        case TOGGLE_FACEDOWN_CARD:
            newState = update(state, { cards: { [cardAction.id]: { $toggle: ['facedown'] } } })
            break;
        default:
            //ignored
            break;
    }
    if (newState !== state) {
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
    cardUnderCursor: (x: HoveredCard = { cardId: null, bfId: null }, y) => {
        switch (y.type) {
            case HOVERED_CARD: return { cardId: y.cardId, bfId: x.bfId };
            case HOVERED_BFCARD: return { cardId: y.cardId, bfId: y.bfId };
        } return x;
    },
})

export default stateReducer

function handleMoveCard(newState: Game, moveCard: MoveCard) {
    // set things if moving around field
    if (moveCard.bfId !== undefined && moveCard.toX !== undefined && moveCard.toY !== undefined) {
        newState = update(newState, { battlefieldCards: { [moveCard.bfId]: { $merge: { x: moveCard.toX, y: moveCard.toY, changed: moveCard.when } } } })
    }
    // re ordering hand
    if (moveCard.tgtZone === HAND && moveCard.srcZone === HAND && moveCard.tgtOwner === moveCard.srcOwner
        && moveCard.toIdx !== undefined) {
        const zoneId = newState.players[moveCard.tgtOwner].zones[HAND]
        const originalIdx = newState.zones[zoneId].cards.indexOf(moveCard.cardId)
        newState = update(newState, {
            zones: {
                [zoneId]: {
                    cards: {
                        $splice: [
                            [originalIdx, 1],
                            [moveCard.toIdx, 0, moveCard.cardId],
                        ]
                    }
                }
            }
        })
    }
    if (moveCard.tgtZone !== moveCard.srcZone || moveCard.tgtOwner !== moveCard.srcOwner) {
        // need to remove from src zone
        if (moveCard.srcZone === BATTLEFIELD && moveCard.bfId !== undefined) {
            const srcBfCardIdx = newState.battlefields[moveCard.srcOwner].battlefieldCards.indexOf(moveCard.bfId)
            newState = update(newState, { battlefields: { [moveCard.srcOwner]: { battlefieldCards: { $splice: [[srcBfCardIdx, 1]] } } } })
            if (moveCard.tgtZone !== BATTLEFIELD) {
                // if destination isn't battlefield, need to destry bf card
                newState = update(newState, {
                    battlefieldCards: {
                        $unset: [moveCard.bfId]
                    }
                })
            }
        }
        else {
            const srcZoneId = newState.players[moveCard.srcOwner].zones[moveCard.srcZone]
            const originalIdx = newState.zones[srcZoneId].cards.indexOf(moveCard.cardId)
            newState = update(newState, {
                zones: {
                    [srcZoneId]: {
                        cards: {
                            $splice: [
                                [originalIdx, 1],
                            ]
                        }
                    }
                }
            })
        }
        // add to tgt zone
        if (moveCard.tgtZone === BATTLEFIELD) {
            if (moveCard.bfId !== undefined) {
                newState = update(newState, { battlefields: { [moveCard.tgtOwner]: { battlefieldCards: { $push: [moveCard.bfId] } } } })
            }
            else {
                let maxId = 0
                for (const bfId in newState.battlefieldCards) {
                    maxId = Math.max(maxId, Number.parseInt(bfId))
                }
                // create a BFCard
                const bfc: BattlefieldCard = {
                    bfId: ++maxId,
                    cardId: moveCard.cardId,
                    x: moveCard.toX ? moveCard.toX : 5,
                    y: moveCard.toY ? moveCard.toY : 5,
                    tapped: false,
                    counters: {},
                    changed: Date.now()
                }
                newState = update(newState, {
                    battlefieldCards: {
                        $merge: { [bfc.bfId]: bfc }
                    }
                })
                newState = update(newState, { battlefields: { [moveCard.tgtOwner]: { battlefieldCards: { $push: [bfc.bfId] } } } })
            }
        }
        else {
            // not moving to battlefield
            const tgtZoneId = newState.players[moveCard.tgtOwner].zones[moveCard.tgtZone]
            if (moveCard.toIdx !== undefined) {
                newState = update(newState, {
                    zones: {
                        [tgtZoneId]: {
                            cards: {
                                $splice: [
                                    [moveCard.toIdx, 0, moveCard.cardId],
                                ]
                            }
                        }
                    }
                })
            }
            else { // append
                newState = update(newState, { zones: { [tgtZoneId]: { cards: { $push: [moveCard.cardId] } } } })
            }
        }
    }
    return newState
}
