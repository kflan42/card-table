import React from 'react'

import {DndProvider} from 'react-dnd'

import {
    BrowserRouter as Router,
    Switch,
    Route,
} from "react-router-dom";

import Backend from 'react-dnd-html5-backend'

import './_style.css';
import LoginForm from './Login'
import {createStore} from 'redux'
import {Provider} from 'react-redux';
import Game from './Game';
import Log from './Log';
import stateReducer from '../Reducers';
import {ConfirmationServiceProvider} from './ConfirmationService';
import ErrorBoundary from "./ErrorBoundary";

const App: React.FC = () => {

    // https://redux.js.org/basics/usage-with-react#passing-the-store
    const store = createStore(stateReducer)

    return (
        <ErrorBoundary>
            <div className="App">
                <Provider store={store}>
                    <Router>
                        <Switch>
                            <Route path="/table/:gameId">
                                <ConfirmationServiceProvider>
                                    <DndProvider backend={Backend}>
                                        <Game/>
                                    </DndProvider>
                                    <Log/>
                                </ConfirmationServiceProvider>
                            </Route>
                            <Route path="/login">
                                <LoginForm/>
                            </Route>
                        </Switch>
                    </Router>
                </Provider>
            </div>
        </ErrorBoundary>
    )
}

export default App