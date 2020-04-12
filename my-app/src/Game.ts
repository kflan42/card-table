
export interface Card {
    id: number,
    tapped: boolean
}

export interface Game {
    cardsById: {[index: number]:Card}
}
