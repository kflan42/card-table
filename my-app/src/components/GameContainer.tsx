/*
Technically, a container component is just a React component 
that uses store.subscribe() to read a part of the Redux state tree 
and supply props to a presentational component it renders. 

You could write a container component by hand, but we suggest instead generating container components 
with the React Redux library's connect() function, which provides many useful optimizations 
to prevent unnecessary re-renders
*/
import { connect } from 'react-redux'
import { Game } from '../Game'
import { load } from '../Actions'
import GamePresenter from './GamePresenter'


const mapStateToProps = (state: Game) => {
    return {
        cards: state.cards
    }
}

const mapDispatchToProps = (dispatch: (arg0: any) => void )=> {
    return {
      onNewCards: (result: any) => {
        dispatch(load(result))
      }
    }
  }


  const GameContainer = connect(mapStateToProps, mapDispatchToProps)(GamePresenter)
  
  export default GameContainer