import { combineReducers } from 'redux'

import update from 'immutability-helper'


import {
  CardAction,
  LOAD,
  TOGGLE_TAP_CARD
} from './Actions'
import { Card } from './Game'


function cards(state: { [index: number]: Card } = {}, action: CardAction) {
  switch (action.type) {
    case LOAD:
      console.log("applying {} to cards", action)
      return action.payload
    case TOGGLE_TAP_CARD:
      console.log("applying {} to cards", action)
      const cardId = action.cardId
      // const x = update(state[cardId], {$toggle: ['tapped']})
      // const y = update(state[cardId], {$apply: (v) => {
      //   v.tapped = !v.tapped
      //   return v
      // }})
      // const z = update(state[cardId], (v) => {
      //     v.tapped = !v.tapped
      //     return v
      //   } )
      // console.log(x,y,z)
      const z = update(state, { [cardId]: { $toggle: ['tapped'] } })
      return z
    default:
      return state
  }
}

const gameReducer = combineReducers({
  cards: cards
})

export default gameReducer