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
    TOGGLE_FACEDOWN_CARD,
    SHUFFLE_LIBRARY,
    SET_PLAYER_COUNTER,
    SET_CARD_COUNTER,
    CREATE_TOKEN,
    ADD_LOG_LINE,
    PlayerAction,
    CardAction,
} from './Actions'
import { Game, HAND, BATTLEFIELD, BattlefieldCard, HoveredCard, LIBRARY, Card } from './ClientState'
import { createTestGame } from './zzzState'
import { shuffleArray } from './Utilities'


function gameReducer(
    state: Game = createTestGame(),
    gameAction: PlayerAction
) {
    let [newState, logLine]: [Game?, string?] = [undefined, undefined]
    let action = null

    function getBfCardName(g: Game, bfId: number) {
        const bfCard = g.battlefieldCards[bfId]
        const card = g.cards[bfCard.cardId]
        return card.facedown ? "a facedown card" : card.name
    }

    switch (gameAction.type) {
        case MOVE_CARD:
            [newState, logLine] = handleMoveCard(state, gameAction as MoveCard)
            break;
        case SHUFFLE_LIBRARY:
            action = gameAction as { type: string, who: string, when: number, owner: string }
            const zoneId = state.players[action.owner].zones[LIBRARY]
            newState = update(state, { zones: { [zoneId]: { cards: a => { shuffleArray(a); return a; } } } })
            logLine = ` shuffled ${action.who === action.owner ? "their" : `${action.owner}'s`} Library`
            break;
        case TOGGLE_TAP_CARD:
            action = gameAction as unknown as CardAction
            newState = update(state, { battlefieldCards: { [action.id]: { $toggle: ['tapped'] } } })
            logLine = ` tapped ${getBfCardName(state, action.id)}`
            break;
        case TOGGLE_TRANSFORM_CARD:
            action = gameAction as unknown as CardAction
            newState = update(state, { cards: { [action.id]: { $toggle: ['transformed'] } } })
            logLine = action.silent ? undefined : ` transformed ${newState.cards[action.id].name}`
            break;
        case TOGGLE_FACEDOWN_CARD:
            action = gameAction as unknown as CardAction
            newState = update(state, { cards: { [action.id]: { $toggle: ['facedown'] } } })
            logLine = action.silent ? undefined : ` flipped ${newState.cards[action.id].name}`
            break;
        case SET_PLAYER_COUNTER:
            action = gameAction as { type: string, who: string, when: number, player: string, kind: string, value: number }
            if (action.value !== 0) {
                newState = update(state, { players: { [action.player]: { counters: { $merge: { [action.kind]: action.value } } } } })
            } else {
                newState = update(state, { players: { [action.player]: { counters: { $unset: [action.kind] } } } })
            }
            logLine = ` set ${action.player}'s ${action.kind} counter to ${action.value}`
            break;
        case SET_CARD_COUNTER:
            action = gameAction as { type: string, who: string, when: number, bfId: number, kind: string, value: number }
            if (action.value !== 0) {
                newState = update(state, { battlefieldCards: { [action.bfId]: { counters: { $merge: { [action.kind]: action.value } } } } })
            } else {
                newState = update(state, { battlefieldCards: { [action.bfId]: { counters: { $unset: [action.kind] } } } })
            }
            logLine = ` set ${getBfCardName(newState, action.bfId)}'s ${action.kind} counter to ${action.value}`
            break;
        case CREATE_TOKEN:
            action = gameAction as { type: string, who: string, when: number, owner: string, copyOfCardId?: number, name?: string }
            // create card for it
            const maxId = Object.keys(state.cards).map(k => Number.parseInt(k)).reduce((p, c) => Math.max(p, c))
            const sourceCard = action.copyOfCardId ? state.cards[action.copyOfCardId] : {
                name: action.name as string,
                facedown: false,
                transformed: false
            }
            const newCard: Card = { ...sourceCard, id: maxId + 1, owner: action.owner, token: true }
            newState = update(state, { cards: { $merge: { [newCard.id]: newCard } } })
            // create bfCard
            newState = newBfCard(newState, action.owner, newCard.id)
            logLine = ` created  ${newCard.name}`
            break;
        case ADD_LOG_LINE:
            action = gameAction as { type: string, who: string, when: number, line: string }
            const actionLine = { who: action.who, when: action.when, line: action.line }
            newState = update(state, { actionLog: { $push: [actionLine] } })
            logLine = undefined // already added a line
            break;
        default:
            // ignored, e.g. all non-game state affecting actions, since all go through all combined reducers
            break;
    }

    if (newState !== undefined) {
        console.log(`${JSON.stringify(gameAction)} applied`)
        if (logLine) {
            // record to user visible game log
            if (newState.actionLog.length > 256) {
                // drop first (oldest)
                newState = update(newState, { actionLog: { $splice: [[0, 1]] } })
            }
            const actionLine = { who: gameAction.who, when: gameAction.when, line: logLine }
            newState = update(newState, { actionLog: { $push: [actionLine] } })
        }
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

function handleMoveCard(newState: Game, moveCard: MoveCard): [Game, string?] {
    const sameOwner = moveCard.tgtOwner === moveCard.srcOwner
    const sameZone = moveCard.tgtZone === moveCard.srcZone
    // set things if moving around field
    if (moveCard.bfId !== undefined && moveCard.toX !== undefined && moveCard.toY !== undefined) {
        newState = update(newState, { battlefieldCards: { [moveCard.bfId]: { $merge: { x: moveCard.toX, y: moveCard.toY, changed: moveCard.when } } } })
    }
    // re ordering hand
    if (moveCard.tgtZone === HAND && moveCard.srcZone === HAND && sameOwner && moveCard.toIdx !== undefined) {
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
    if (!sameZone || !sameOwner) {
        // need to remove from src zone
        if (moveCard.srcZone === BATTLEFIELD && moveCard.bfId !== undefined) {
            const srcBfCardIdx = newState.battlefields[moveCard.srcOwner].battlefieldCards.indexOf(moveCard.bfId)
            newState = update(newState, { battlefields: { [moveCard.srcOwner]: { battlefieldCards: { $splice: [[srcBfCardIdx, 1]] } } } })
            if (moveCard.tgtZone !== BATTLEFIELD) {
                // if destination isn't battlefield, need to destry bf card
                newState = update(newState, { battlefieldCards: { $unset: [moveCard.bfId] } })
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
                // create a BFCard
                newState = newBfCard(newState, moveCard.tgtOwner, moveCard.cardId, moveCard.toX, moveCard.toY)
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
    const draw = sameOwner && moveCard.srcZone === LIBRARY && moveCard.tgtZone === HAND
    const line = draw ? 'drew a card'
        : `moved a card from ${moveCard.srcOwner}'s ${moveCard.srcZone} to ${moveCard.tgtOwner}'s ${moveCard.tgtZone}`
    return [newState, sameOwner && sameZone ? undefined : line]
}

function newBfCard(newState: Game, owner: string, cardId: number, toX?: number, toY?: number, ) {
    const maxId = Object.keys(newState.battlefieldCards).map(k => Number.parseInt(k)).reduce((p, c) => Math.max(p, c))
    const bfc: BattlefieldCard = {
        bfId: maxId + 1,
        cardId: cardId,
        x: toX ? toX : 5,
        y: toY ? toY : 5,
        tapped: false,
        counters: {},
        changed: Date.now()
    }
    newState = update(newState, { battlefieldCards: { $merge: { [bfc.bfId]: bfc } } })
    newState = update(newState, { battlefields: { [owner]: { battlefieldCards: { $push: [bfc.bfId] } } } })
    return newState
}

