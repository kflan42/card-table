
export const LOCAL_STATE_LOAD = 'LOCAL_STATE_LOAD'
export function localStateLoaded(name: string, color: string) {
    return {
        type: LOCAL_STATE_LOAD,
        payload: { name: name, color: color },
    }
}

export const MOVE_CARD = 'MOVE_CARD'
export interface MoveCard {
    type: string
    when: number
    bfId?: number
    cardId: number
    srcZone: string
    srcOwner: string
    tgtZone: string
    tgtOwner: string
    toX?: number
    toY?: number
    toIdx?: number
}

export const HOVERED_CARD = 'HOVERED_CARD'
export function hoveredCard(cardId: number | null) {
    return {
        type: HOVERED_CARD,
        cardId
    }
}

export const HOVERED_BFCARD = 'HOVERED_BFCARD'
export function hoveredBFCard(bfId: number | null, cardId?: number) {
    return {
        type: HOVERED_BFCARD,
        bfId,
        cardId
    }
}

export const TOGGLE_TAP_CARD = 'TOGGLE_TAP_CARD'
export const TOGGLE_TRANSFORM_CARD = 'TOGGLE_TRANSFORM_CARD'
export const TOGGLE_FACEDOWN_CARD = 'TOGGLE_FACEDOWN_CARD'
export function cardAction(type:string, id: number) {
    return {
        type,
        id
    }
}

