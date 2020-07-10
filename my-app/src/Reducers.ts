import {combineReducers} from 'redux'
import update from 'immutability-helper'


import {CLEAR_LINES, DRAWING, DRAWLINE, HOVERED_BFCARD, HOVERED_CARD, SET_USER_PREFS, TOGGLE_PLAYMAT, HOVERED_BATTLEFIELD,} from './Actions'
import {Drawing, HoveredCard, PlayerPrefs} from './ClientState'
import {gameReducer} from "./GameReducer";


const stateReducer = combineReducers({
    playerPrefs: (x: PlayerPrefs = {name: "", handCardSize: 1, bfCardSize: 1, bfImageQuality: "", rightClickPopup: false}, y) => {
        if (y.type === SET_USER_PREFS) {
            return Object.assign({}, x, y.payload);
        }
        else return x;
    },
    game: gameReducer,
    hoveredCard: (x: HoveredCard = {cardId: null, bfId: null, bf: null}, y) => {
        switch (y.type) {
            case HOVERED_CARD:
                return {cardId: y.cardId, bfId: x.bfId};
            case HOVERED_BFCARD:
                return {cardId: y.cardId, bfId: y.bfId};
            case HOVERED_BATTLEFIELD:
                return {...x, bf:y.bf}
        }
        return x;
    },
    drawing: (x: Drawing = {first: null, lines: []}, y) => {
        switch (y.type) {
            case DRAWING:
                return update(x, {first: {$set: y.first}});
            case DRAWLINE:
                const nl = y.entityLine
                if (x.lines.filter(el => el.color === nl.color && el.from === nl.from && el.to === nl.to).length === 0) {
                    return update(x, {lines: {$push: [y.entityLine]}})
                } else {
                    // already got this one
                    return x
                }
            case CLEAR_LINES:
                const newLines = x.lines.filter(el => (el.color !== y.color))
                return update(x, {lines: {$set: newLines}})
            default:
                return x;
        }
    },
    hiddenPlaymats: (x: string[] = [], y) => {
        switch (y.type) {
            case TOGGLE_PLAYMAT:
                return x.includes(y.player) ? x.filter(s => s !== y.player) : x.concat([y.player])
            default:
                return x
        }
    }
})

export default stateReducer
