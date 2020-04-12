import { combineReducers } from 'redux'

import update from 'immutability-helper'


import {
  TAP_CARD,
  UNTAP_CARD,
  CardAction
} from './Actions'
import { Game, Card } from './Game'

function foo(state = {}, action: any) {
  switch (action.type) {
    case 'bar':
      return action.baz
    default:
      return state
  }
}


function cardsById(state: {[index:number]:Card} = {}, action: CardAction) {
  switch (action.type) {
    case TAP_CARD:
        const cardId = action.cardId
        const card = state[cardId]
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
        const z = update(state, { [cardId]: {$toggle: ['tapped']}})
        return z
    default:
      return state
  }
}

const todoApp = combineReducers({
  cardsById
})

export default todoApp