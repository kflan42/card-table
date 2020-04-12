
export const TAP_CARD = 'TAP_CARD'
export const UNTAP_CARD = 'UNTAP_CARD'

export interface CardAction {
    type: string,
    cardId: number
}

export function tapCard(id: number) : CardAction {
    return {
        type: TAP_CARD,
        cardId: id 
    }
}

export function untapCard(id: number) : CardAction {
    return {
        type: UNTAP_CARD,
        cardId: id 
    }
}
