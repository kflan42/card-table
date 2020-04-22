import { combineReducers } from 'redux'

import update from 'immutability-helper'


import {
  CardAction,
  TOGGLE_TAP_CARD
} from './Actions'
import { Game } from './ClientState'
import { createTestGame } from './zzzState'


// TODO generalize actions to cover counters etc
function gameReducer(state: Game = createTestGame(), action: CardAction) {
  switch (action.type) {
    case TOGGLE_TAP_CARD:
      console.log("applying {} to cards", action)
      const bfId = action.bfId
      // const x = update(state[cardId], {$toggle: ['tapped']})
      // const y = update(state[cardId], {$apply: (v) => {
      //   v.tapped = !v.tapped
      //   return v
      // }})
      //  const z = update(state.battlefieldCards[bfId], (v) => {
      //      v.tapped = !v.tapped
      //      return v
      //    } ) // returns just card, not whole state
      // console.log(x,y,z)
      const z = update(state, { battlefieldCards:{[bfId]: { $toggle: ['tapped'] } }})
      return z
  }
  return state
}

// function cards(state: { [index: number]: Card } = {}, action: CardAction) {
//   switch (action.type) {
//     case LOAD:
//       console.log("applying {} to cards", action)
//       return action.payload
//     case TOGGLE_TAP_CARD:
//       console.log("applying {} to cards", action)
//       const cardId = action.cardId
//       // const x = update(state[cardId], {$toggle: ['tapped']})
//       // const y = update(state[cardId], {$apply: (v) => {
//       //   v.tapped = !v.tapped
//       //   return v
//       // }})
//       // const z = update(state[cardId], (v) => {
//       //     v.tapped = !v.tapped
//       //     return v
//       //   } )
//       // console.log(x,y,z)
//       //tapped used to be on Card const z = update(state, { [cardId]: { $toggle: ['tapped'] } })
//       //return z
//     default:
//       return state
//   }
// }

//const cp = {x:1, y:1, visible:true, cardId:1}

const stateReducer = combineReducers({
  playerName: (x = null, y) => {
    if (y.type === "set name") return y.value;
    else return x;
  },
  cardPopup: (x = null, y) => x,
  game: gameReducer
})

export default stateReducer