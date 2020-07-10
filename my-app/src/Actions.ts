import {EntityLine, Game} from "./ClientState";
import { XYCoord } from "react-dnd";

export const SET_USER_PREFS = 'SET_USER_PREFS'
export function setUserPrefs(prefs: Object) {
    return {
        type: SET_USER_PREFS,
        payload: prefs,
    }
}

export const TOGGLE_PLAYMAT = 'TOGGLE_PLAYMAT'
export function togglePlaymat(player: string) {
    return {
        type: TOGGLE_PLAYMAT,
        player
    }
}

export const DRAWING = 'DRAWING'
export function drawing(first: string|null) {
    return {type: DRAWING, first}
}

export const DRAWLINE = 'DRAWLINE'
export function drawLine(entityLine: EntityLine) {
    return {type: DRAWLINE, entityLine}
}

export const CLEAR_LINES = 'CLEAR_LINES'
export function clearLines(color: string) {
    return {type:CLEAR_LINES, color}
}

export const SHUFFLE_LIBRARY = 'SHUFFLE_LIBRARY'
export function shuffleLibrary(owner: string) {
    return {
        type: SHUFFLE_LIBRARY,
        owner
    }
}

export interface PlayerAction {
    type: string,
    who: string,
    when: number
}


export const MOVE_CARD = 'MOVE_CARD'
export interface MoveCard extends PlayerAction {
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

export const HOVERED_BATTLEFIELD = 'HOVERED_BATTLEFIELD'
export function hoveredBattlefield(bf: HTMLDivElement|null, sourceClientOffset: XYCoord|null) {
    return {
        type: HOVERED_BATTLEFIELD,
        bf,
        sourceClientOffset
    }
}

export const TOGGLE_TAP_CARD = 'TOGGLE_TAP_CARD'
export const TOGGLE_TRANSFORM_CARD = 'TOGGLE_TRANSFORM_CARD'
export const TOGGLE_FACEDOWN_CARD = 'TOGGLE_FACEDOWN_CARD'
export interface CardAction { type: string, id: number, silent?:boolean }
export function cardAction(type: string, id: number, silent?:boolean) : CardAction {
    return {
        type,
        id,
        silent
    }
}

export const UNTAP_ALL = 'UNTAP_ALL'
export function untapAll() {
    return {
        type:UNTAP_ALL,
    }
}

export const SET_PLAYER_COUNTER = 'SET_PLAYER_COUNTER'
export function setPlayerCounter(player: string, kind: string, value: number) {
    return {
        type: SET_PLAYER_COUNTER,
        player,
        kind,
        value,
    }
}

export const SET_CARD_COUNTER = 'SET_CARD_COUNTER'
export function setCardCounter(bfId: number, kind: string, value: number) {
    return {
        type: SET_CARD_COUNTER,
        bfId,
        kind,
        value,
    }
}

export const CREATE_TOKEN = 'CREATE_TOKEN'
export function createTokenCopy(owner: string, copyOfCardId: number) {
    return {
        type: CREATE_TOKEN,
        owner,
        copyOfCardId,
        sf_id: null,
    }
}
export function createTokenNew(owner: string, sf_id: string) {
    return {
        type: CREATE_TOKEN,
        owner,
        copyOfCardId: null,
        sf_id,
    }
}

export const ADD_LOG_LINE = 'ADD_LOG_LINE'
export function addLogLine(line: string) {
    return {
        type: ADD_LOG_LINE,
        line
    }
}

export interface GameSet extends PlayerAction {
    game: Game
}
export const SET_GAME = 'SET_GAME';
export function setGame(game: Game): GameSet {
    return {type: SET_GAME, who: 'Table', when: Date.now(), game: game}
}
