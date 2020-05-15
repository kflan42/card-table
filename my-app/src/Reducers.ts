import {combineReducers} from 'redux'


import {DRAWING, DRAWLINE, HOVERED_BFCARD, HOVERED_CARD, LOCAL_STATE_LOAD,} from './Actions'
import {HoveredCard} from './ClientState'
import {gameReducer} from "./GameReducer";


const stateReducer = combineReducers({
    playerPrefs: (x = {name: undefined, color: undefined}, y) => {
        if (y.type === LOCAL_STATE_LOAD) return y.payload;
        else return x;
    },
    game: gameReducer,
    hoveredCard: (x: HoveredCard = {cardId: null, bfId: null}, y) => {
        switch (y.type) {
            case HOVERED_CARD:
                return {cardId: y.cardId, bfId: x.bfId};
            case HOVERED_BFCARD:
                return {cardId: y.cardId, bfId: y.bfId};
        }
        return x;
    },
    drawStage: (x: number = 0, y) => {
        switch (y.type) {
            case DRAWING:
                return y.drawing;
                break;
            default:
                return x;
        }
    },
    drawLines: (x: number[] = [], y) => {
        switch (y.type) {
            case DRAWLINE:
                return [...x, y.cardId]
                break;
            default:
                return x;
        }
    }
})

export default stateReducer
