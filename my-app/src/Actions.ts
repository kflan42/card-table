import { EntityLine } from "./ClientState";
import { XYCoord } from "react-dnd";
import { Game as GameT, LogLine, Table, TableCard } from "./magic_models"

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
export function drawing(first: string | null) {
    return { type: DRAWING, first }
}

export const DRAWLINE = 'DRAWLINE'
export function drawLine(entityLine: EntityLine) {
    return { type: DRAWLINE, entityLine }
}

export const CLEAR_LINES = 'CLEAR_LINES'
export function clearLines(color: string) {
    return { type: CLEAR_LINES, color }
}

export const NEXT_TURN = 'NEXT_TURN'
export function nextTurn(player: string) {
    return { type: NEXT_TURN, player }
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
export function hoveredBattlefield(bf: HTMLDivElement | null, sourceClientOffset: XYCoord | null) {
    return {
        type: HOVERED_BATTLEFIELD,
        bf,
        sourceClientOffset
    }
}

export const SHUFFLE_LIBRARY = 'SHUFFLE_LIBRARY'
export const MOVE_CARD = 'MOVE_CARD'
export const TOGGLE_TAP_CARD = 'TOGGLE_TAP_CARD'
export const TOGGLE_TRANSFORM_CARD = 'TOGGLE_TRANSFORM_CARD'
export const TOGGLE_FACEDOWN_CARD = 'TOGGLE_FACEDOWN_CARD'
export const TOGGLE_FLIP_CARD = 'TOGGLE_FLIP_CARD'
export const UNTAP_ALL = 'UNTAP_ALL'
export const SET_PLAYER_COUNTER = 'SET_PLAYER_COUNTER'
export const SET_CARD_COUNTER = 'SET_CARD_COUNTER'
export const CREATE_TOKEN = 'CREATE_TOKEN'
export const MESSAGE = 'MESSAGE'
export const RANDOMNESS = 'RANDOMNESS'
export const MULLIGAN = 'MULLIGAN'

export interface GameUpdate {
    type: string
    when: number
    game: GameT,
    tableCards: TableCard[],
    logLines: LogLine[]
}
export const SET_GAME = 'SET_GAME';
export function setGame(tableUpdate: Table): GameUpdate {
    return { type: SET_GAME, when: Date.now(), game: tableUpdate.game, tableCards: tableUpdate.table_cards, logLines: tableUpdate.log_lines }
}

export const UPDATE_GAME = 'UPDATE_GAME';
export function updateGame(tableUpdate: Table): GameUpdate {
    return { type: UPDATE_GAME, when: Date.now(), game: tableUpdate.game, tableCards: tableUpdate.table_cards, logLines: tableUpdate.log_lines }
}

export const SET_GAME_ID = 'SET_GAME_ID'
export function setGameId(gameId: string) {
    return { type: SET_GAME_ID, gameId }
}