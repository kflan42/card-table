
export const TAP_CARD = 'TAP_CARD'
export const UNTAP_CARD = 'UNTAP_CARD'
export const TOGGLE_TAP_CARD = 'TOGGLE_TAP_CARD'
export const LOCAL_STATE_LOAD = 'LOCAL_STATE_LOAD'
export const REORDER_HAND = 'REORDER_HAND'

// item types for react dnd
export const CARD = "card"
export const COOUNTER = "counter"

export interface CardAction {
    type: string
    bfId?: number
    cardId?: number
    payload?: any
}

export function localStateLoaded(name: string, color: string){
    return {
        type: LOCAL_STATE_LOAD,
        payload: {name:name, color:color},
    }
}

export function reorderHand(owner:string, cardId: number, fromIndex: number, toIndex: number) {
    return {
        type: REORDER_HAND,
        owner: owner,
        cardId: cardId,
        fromIndex: fromIndex,
        toIndex: toIndex,
    }
}

export function tapCard(id: number): CardAction {
    return {
        type: TAP_CARD,
        bfId: id,
    }
}

export function untapCard(id: number): CardAction {
    return {
        type: UNTAP_CARD,
        bfId: id,
    }
}

export function toggleTap(id: number): CardAction {
    return {
        type: TOGGLE_TAP_CARD,
        bfId: id,
    }
}

