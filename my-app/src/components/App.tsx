import React from 'react'

import { DndProvider } from 'react-dnd'

import {
    BrowserRouter as Router,
    Switch,
    Route,
} from "react-router-dom";

import Backend from 'react-dnd-html5-backend'

import './zeStyle.css';
import LoginForm from './Login'
import { Clock } from './Clock'
import { createStore } from 'redux'
import { Provider } from 'react-redux';
import gameReducer from '../Reducers';
import GameContainer from './GameContainer';

const App: React.FC = () => {

    const store = createStore(gameReducer) // see https://redux.js.org/basics/usage-with-react#passing-the-store

    return (
        <Router>
            <Clock></Clock>

            <Switch>
                <Route path="/:gameId">
                    <Provider store={store}>
                        <DndProvider backend={Backend}>
                            <GameContainer />
                        </DndProvider>
                    </Provider>
                </Route>
                <Route path="/">
                    <LoginForm />
                </Route>
            </Switch>
        </Router>
    )
}

export default App