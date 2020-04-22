import { Card } from "./ClientState"

export const TAP_CARD = 'TAP_CARD'
export const UNTAP_CARD = 'UNTAP_CARD'
export const TOGGLE_TAP_CARD = 'TOGGLE_TAP_CARD'
export const LOAD = 'LOAD'

export interface CardAction {
    type: string
    bfId: number
    payload: any
}

export function load(newCards: {[index: number]:Card}): CardAction {
    return {
        type: LOAD,
        bfId: -1,
        payload: newCards,
    }
}


export function tapCard(id: number): CardAction {
    return {
        type: TAP_CARD,
        bfId: id,
        payload: null,
    }
}

export function untapCard(id: number): CardAction {
    return {
        type: UNTAP_CARD,
        bfId: id,
        payload: null,
    }
}

export function toggleTap(id: number): CardAction {
    return {
        type: TOGGLE_TAP_CARD,
        bfId: id,
        payload: null,
    }
}

