/** state of this client, e.g. popups and options */
import {BattlefieldCard, Card, Game as GameT, LogLine, Player, Zone} from "./magic_models";

export interface ClientState {
    playerPrefs: PlayerPrefs,
    game: Game,
    hoveredCard: HoveredCard,
    drawing: Drawing,
    hiddenPlaymats: string[]
}

export interface Drawing {
    first: string | null
    lines: EntityLine[]
}

export interface EntityLine {
    from: string
    to: string
    color: string
}

export interface HoveredCard {
    cardId: number | null,
    bfId: number | null,
    bf: HTMLDivElement | null,
}

export interface PlayerPrefs {
    name: string,
    handCardSize: number,
    bfCardSize: number,
    bfImageQuality: string,
    rightClickPopup: boolean
}

export const HAND: string = "Hand"
export const LIBRARY: string = "Library"
export const GRAVEYARD: string = "Graveyard"
export const COMMAND_ZONE: string = "Command Zone"
export const EXILE: string = "Exile"
export const BATTLEFIELD: string = "Battlefield"

export interface Game {
    cards: { [index: number]: Card }
    players: { [index: string]: Player }
    /** indexed by owner-name */
    zones: { [index: string]: Zone }
    /** index by bfCard bfId */
    battlefieldCards: { [index: number]: BattlefieldCard }
    actionLog: LogLine[]
    processedActions: Set<string>
}

export function index_game(game: GameT): Game {
    return {
        players: game.players.reduce((d, x, i) => ({...d, [x.name]: x}), {}),
        cards: game.cards.reduce((d, x, i) => ({...d, [x.card_id]: x}), {}),
        zones: game.zones.reduce((d, x, i) => ({...d, [`${x.owner}-${x.name}`]: x}), {}),
        battlefieldCards: game.battlefield_cards.reduce((d, x, i) => ({...d, [x.bf_id]: x}), {}),
        actionLog: game.action_log,
        processedActions: new Set<string>()
    };
}

export function whichZone(card_id: number, game: Game): { zone: Zone, bfId: number | undefined } {
    for (const zone of Object.values(game.zones)) {
        if (zone.name === BATTLEFIELD) {
            const bfId = zone.cards.find(i => game.battlefieldCards[i].card_id === card_id)
            if (bfId !== undefined) {
                return {zone, bfId}
            }
        } else if (zone.cards.includes(card_id)) {
            return {zone, bfId: undefined}
        }
    }
    throw new Error(`Card ${card_id} not found`)
}
