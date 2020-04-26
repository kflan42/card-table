/** state of this client, e.g. popups and options */
export interface ClientState {
    playerPrefs: PlayerPrefs,
    game: Game,
    cardUnderCursor: number | null
}

export interface PlayerPrefs {
    name: string,
}

/** state of the game itself, regardless of viewer. shared via server to other clients. */
export interface Game {
    cards: { [index: number]: Card }
    players: { [index: string]: Player }
    /** indexed by zoneId */
    zones: { [index: number]: Zone }
    /** indexed by player name */
    battlefields: { [index: string]: Battlefield }
    /** index by bfCard bfId */
    battlefieldCards: { [index: number]: BattlefieldCard }
}

export interface Card {
    /** referenced throughout state, unique */
    id: number,
    /** used to lookup pic in CardDB */
    name: string,
    set?: string,
    setNumber?: string, // can have weird chars in it
    /** used for sleeve color and some actions */
    owner: string
}

export interface Player {
    name: string,
    /** which card ids are in this player's deck. 1st = commander */
    deck: number[],
    counters: { [index: string]: number }
    zones: {[index: string]: number}
    color: string,
}


/** aka card stack, excludes battlefield */
export interface Zone {
    id: number,
    name: string,
    /** who can act on it easily */
    owner: string,
    cards: number[]
}

export interface Battlefield {
    battlefieldCards: number[]
}

export interface BattlefieldCard {
    bfId: number,
    cardId: number,
    x: number,
    y: number,
    tapped: boolean,
    facedown: boolean,
    transformed: boolean,
    counters: { [index: string]: number }
}
