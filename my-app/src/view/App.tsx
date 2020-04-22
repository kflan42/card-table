import React from 'react'

import { DndProvider } from 'react-dnd'

import {
    BrowserRouter as Router,
    Switch,
    Route,
} from "react-router-dom";

import Backend from 'react-dnd-html5-backend'

import './_style.css';
import LoginForm from './Login'
import { createStore } from 'redux'
import { Provider } from 'react-redux';
import Game from './Game';
import Log from './Log';
import stateReducer from '../Reducers';

const App: React.FC = () => {

    // https://redux.js.org/basics/usage-with-react#passing-the-store
    const store = createStore(stateReducer)

    return (
        <div className="App">
            <Router>

                <Switch>
                    <Route path="/:gameId">
                        <Provider store={store}>    
                            <DndProvider backend={Backend}>
                                <Game/>
                            </DndProvider>
                            <Log>
                                
                            </Log>
                        </Provider>
                    </Route>
                    <Route path="/">
                        <LoginForm />
                    </Route>
                </Switch>
            </Router>
        </div>
    )
}

export default App