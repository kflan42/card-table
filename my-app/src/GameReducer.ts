import update from 'immutability-helper'


import {
    ADD_LOG_LINE,
    CardAction,
    CREATE_TOKEN,
    GameSet,
    MOVE_CARD,
    MoveCard,
    PlayerAction,
    SET_CARD_COUNTER,
    SET_GAME,
    SET_PLAYER_COUNTER,
    SHUFFLE_LIBRARY,
    TOGGLE_FACEDOWN_CARD,
    TOGGLE_TAP_CARD,
    TOGGLE_TRANSFORM_CARD, UNTAP_ALL,
} from './Actions'
import {BATTLEFIELD, Game, HAND, LIBRARY} from './ClientState'
import {shuffleArray} from './Utilities'
import CardDB from "./CardDB";
import {BattlefieldCard, Card} from "./magic_models";

function getBfCardName(g: Game, bfId: number) {
        const bfCard = g.battlefieldCards[bfId]
        return getCardName(g, bfCard.card_id)
    }

function getCardName(g: Game, cardId: number) {
    const card = g.cards[cardId]
    const sfCard = CardDB.getCard(card.sf_id)
    return card.facedown ? "a facedown card" : sfCard.name
}

export function gameReducer(
    state: Game = {
        players: {},
        cards: {},
        zones: {},
        battlefieldCards: {},
        actionLog: [],
        processedActions: new Set<string>()
    },
    gameAction: PlayerAction
) {
    // we get local action directly and from server so must de-dupe
    let actionKey = `${gameAction.who}@${gameAction.when}`;
    if (state.processedActions.has(actionKey)) {
        return state; // nothing to do
    } else {
        state.processedActions.add(actionKey)
    }

    let [newState, logLine]: [Game?, string?] = [undefined, undefined]
    let action = null

    switch (gameAction.type) {
        case SET_GAME:
            newState = (gameAction as GameSet).game
            logLine = "Game set."
            break;
        case MOVE_CARD:
            [newState, logLine] = handleMoveCard(state, gameAction as MoveCard)
            break;
        case SHUFFLE_LIBRARY:
            const shuffleAction = gameAction as { type: string, who: string, when: number, owner: string }
            const zoneId = `${shuffleAction.owner}-${LIBRARY}`
            newState = update(state, {
                zones: {
                    [zoneId]: {
                        cards: a => {
                            shuffleArray(a, shuffleAction.when);
                            return a;
                        }
                    }
                }
            })
            logLine = ` shuffled ${shuffleAction.who === shuffleAction.owner ? "their" : `${shuffleAction.owner}'s`} Library`
            break;
        case TOGGLE_TAP_CARD:
            action = gameAction as unknown as CardAction
            newState = update(state, {battlefieldCards: {[action.id]: {$toggle: ['tapped']}}})
            const nowTapped = newState.battlefieldCards[action.id].tapped
            logLine = ` ${nowTapped ? '' : 'un'}tapped ${getBfCardName(state, action.id)}`
            break;
        case UNTAP_ALL:
            const cardIds = new Set(Object.values(state.cards).filter(c=>c.owner === gameAction.who).map(c=>c.card_id))
            let count = 0
            const newBfCards: { [index: number]: BattlefieldCard } = {}
            for (let bf of Object.values(state.battlefieldCards).filter(b=>b.tapped && cardIds.has(b.card_id))) {
                count++
                newBfCards[bf.bf_id] = {...bf, tapped: false}
            }
            newState = update(state, {battlefieldCards: {$merge: newBfCards}})
            logLine = ` ${gameAction.who} untapped ${count} cards`
            break;
        case TOGGLE_TRANSFORM_CARD:
            action = gameAction as unknown as CardAction
            newState = update(state, {cards: {[action.id]: {$toggle: ['transformed']}}})
            logLine = action.silent ? undefined : ` transformed ${getCardName(state, action.id)}`
            break;
        case TOGGLE_FACEDOWN_CARD:
            action = gameAction as unknown as CardAction
            newState = update(state, {cards: {[action.id]: {$toggle: ['facedown']}}})
            logLine = action.silent ? undefined : ` flipped ${getCardName(state, action.id)}`
            break;
        case SET_PLAYER_COUNTER:
            action = gameAction as { type: string, who: string, when: number, player: string, kind: string, value: number }
            if (action.value !== 0) {
                const kind = action.kind
                let idx = state.players[action.player].counters.findIndex(c=>c.name === kind)
                if (idx < 0) idx = state.players[action.player].counters.length
                newState = update(state, {
                    players: {
                        [action.player]: {
                            counters: {
                                $merge: {
                                    [idx]: {
                                        name: action.kind,
                                        value: action.value
                                    }
                                }
                            }
                        }
                    }
                })
            } else {
                const kind = action.kind
                const newCounters = state.players[action.player].counters.filter(c => (c.name !== kind))
                newState = update(state, {players: {[action.player]: {counters: {$set: newCounters}}}})
            }
            let whose = action.player !== action.who ? `${action.player}'s` : 'their';
            logLine = ` set ${whose} ${action.kind} counter to ${action.value}`
            break;
        case SET_CARD_COUNTER:
            action = gameAction as { type: string, who: string, when: number, bfId: number, kind: string, value: number }
            if (action.value !== 0) {
                const kind = action.kind
                let idx = state.battlefieldCards[action.bfId].counters.findIndex(c=>c.name === kind)
                if (idx < 0) idx = state.battlefieldCards[action.bfId].counters.length
                newState = update(state, {
                    battlefieldCards: {
                        [action.bfId]: {
                            counters: {
                                $merge: {
                                    [idx]: {
                                        name: action.kind,
                                        value: action.value
                                    }
                                }
                            }
                        }
                    }
                })
            } else {
                const kind = action.kind
                const newCounters = state.battlefieldCards[action.bfId].counters.filter(c => (c.name !== kind))
                newState = update(state, {battlefieldCards: {[action.bfId]: {counters: {$set: newCounters}}}})
            }
            logLine = ` set ${getBfCardName(newState, action.bfId)}'s ${action.kind} counter to ${action.value}`
            break;
        case CREATE_TOKEN:
            action = gameAction as { type: string, who: string, when: number, owner: string, copyOfCardId?: number, sf_id?: string }
            // create card for it
            const maxId = Object.keys(state.cards).map(k => Number.parseInt(k)).reduce((p, c) => Math.max(p, c))
            const sourceCard = action.copyOfCardId ? state.cards[action.copyOfCardId] : {
                sf_id: action.sf_id as string,
                facedown: false,
                transformed: false
            }
            const newCard: Card = {...sourceCard, card_id: maxId + 1, owner: action.owner, token: true}
            newState = update(state, {cards: {$merge: {[newCard.card_id]: newCard}}})
            // create bfCard
            newState = addNewBfCard(newState, action.owner, newCard.card_id)
            logLine = ` created  ${getCardName(newState, newCard.card_id)}`
            break;
        case ADD_LOG_LINE:
            action = gameAction as { type: string, who: string, when: number, line: string }
            const actionLine = {who: action.who, when: action.when, line: action.line}
            newState = update(state, {actionLog: {$push: [actionLine]}})
            logLine = undefined // already added a line
            break;
        default:
            // ignored, e.g. all non-game state affecting actions, since all go through all combined reducers
            break;
    }

    if (newState !== undefined) {
        console.log('applied', gameAction)
        if (logLine) {
            // record to user visible game log
            if (newState.actionLog.length > 256) {
                // drop first (oldest)
                newState = update(newState, {actionLog: {$splice: [[0, 1]]}})
            }
            const actionLine = {who: gameAction.who, when: gameAction.when, line: logLine}
            newState = update(newState, {actionLog: {$push: [actionLine]}})
        }
        return newState
    }
    return state
}

function handleMoveCard(newState: Game, moveCard: MoveCard): [Game, string?] {
    const sameOwner = moveCard.tgtOwner === moveCard.srcOwner
    const sameZone = moveCard.tgtZone === moveCard.srcZone
    // set things if moving around field
    if (moveCard.bfId !== undefined && moveCard.toX !== undefined && moveCard.toY !== undefined) {
        newState = update(newState, {
            battlefieldCards: {
                [moveCard.bfId]: {
                    $merge: {
                        x: moveCard.toX,
                        y: moveCard.toY,
                        last_touched: moveCard.when
                    }
                }
            }
        })
    }
    // re ordering hand
    if (moveCard.tgtZone === HAND && moveCard.srcZone === HAND && sameOwner && moveCard.toIdx !== undefined) {
        const zoneId = `${moveCard.tgtOwner}-${HAND}`
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
            const zoneId = `${moveCard.srcOwner}-${BATTLEFIELD}`
            const srcBfCardIdx = newState.zones[zoneId].cards.indexOf(moveCard.bfId)
            newState = update(newState, {zones: {[zoneId]: {cards: {$splice: [[srcBfCardIdx, 1]]}}}})
            if (moveCard.tgtZone !== BATTLEFIELD) {
                // if destination isn't battlefield, need to destry bf card
                newState = update(newState, {battlefieldCards: {$unset: [moveCard.bfId]}})
            }
        } else {
            const srcZoneId = `${moveCard.srcOwner}-${moveCard.srcZone}`
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
                const zoneId = `${moveCard.tgtOwner}-${BATTLEFIELD}`
                newState = update(newState, {zones: {[zoneId]: {cards: {$push: [moveCard.bfId]}}}})
            } else {
                // create a BFCard
                newState = addNewBfCard(newState, moveCard.tgtOwner, moveCard.cardId, moveCard.toX, moveCard.toY)
            }
        } else {
            // not moving to battlefield
            const tgtZoneId = `${moveCard.tgtOwner}-${moveCard.tgtZone}`
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
            } else { // append
                newState = update(newState, {zones: {[tgtZoneId]: {cards: {$push: [moveCard.cardId]}}}})
            }
        }
    }
    let line = `moved a card from ${moveCard.srcOwner}'s ${moveCard.srcZone} to ${moveCard.tgtOwner}'s ${moveCard.tgtZone}`
    if(sameOwner && moveCard.srcZone === LIBRARY && moveCard.tgtZone === HAND) {
        line = 'drew a card'
    } else if (sameOwner && moveCard.srcZone === HAND && moveCard.tgtZone === BATTLEFIELD) {
        line = `played ${getCardName(newState, moveCard.cardId)}`
    }
    return [newState, sameOwner && sameZone ? undefined : line]
}

function addNewBfCard(newState: Game, owner: string, cardId: number, toX?: number, toY?: number,) {
    const maxId = Object.keys(newState.battlefieldCards).map(k => Number.parseInt(k)).reduce((p, c) => Math.max(p, c), 0)
    const bfc: BattlefieldCard = {
        bf_id: maxId + 1,
        card_id: cardId,
        x: toX ? toX : 5,
        y: toY ? toY : 5,
        tapped: false,
        counters: [],
        last_touched: Date.now()
    }
    newState = update(newState, {battlefieldCards: {$merge: {[bfc.bf_id]: bfc}}})
    newState = update(newState, {zones: {[`${owner}-${BATTLEFIELD}`]: {cards: {$push: [bfc.bf_id]}}}})
    return newState
}

