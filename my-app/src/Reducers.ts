import { combineReducers } from 'redux'

import update from 'immutability-helper'


import {
  CardAction,
  TOGGLE_TAP_CARD,
  LOCAL_STATE_LOAD,
  REORDER_HAND,
  HOVERED_CARD
} from './Actions'
import { Game } from './ClientState'
import { createTestGame } from './zzzState'


// TODO generalize actions to cover counters etc
function gameReducer(state: Game = createTestGame(), action: any) {
  console.log("applying {} to cards", action)
  switch (action.type) {
    case TOGGLE_TAP_CARD:
      //  const z = update(state.battlefieldCards[bfId], (v) => {
      //      v.tapped = !v.tapped
      //      return v
      //    } ) // returns just card, not whole state
      const bfId = action.bfId
      return update(state, { battlefieldCards: { [bfId]: { $toggle: ['tapped'] } } })
    case REORDER_HAND:
      // update(cards, {
      //   $splice: [
      //     [index, 1],
      //     [toIndex, 0, card],
      //   ],
      // }),
      const zoneId = state.players[action.owner].zones["Hand"]
      return update(state, {
        zones: {
          [zoneId]: {
            cards: {
              $splice: [
                [action.fromIndex, 1],
                [action.toIndex, 0, action.cardId],
              ]
            }
          }
        }
      })
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
  playerPrefs: (x = { name: undefined, color: undefined }, y) => {
    if (y.type === LOCAL_STATE_LOAD) return y.payload;
    else return x;
  },
  game: gameReducer,
  cardUnderCursor: (x = null, y) => {
    if (y.type === HOVERED_CARD) return y.cardId;
    else return x;
  },
})

export default stateReducer