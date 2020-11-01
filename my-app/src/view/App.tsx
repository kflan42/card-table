import React from 'react'

import {DndProvider} from 'react-dnd'

import {
    Switch,
    Route, useLocation
} from "react-router-dom";

import Backend from 'react-dnd-html5-backend'

import './_style.css';
import RoomForm from './RoomForm'
import {createStore} from 'redux'
import {Provider} from 'react-redux';
import Game from './Game';
import stateReducer from '../Reducers';
import {ConfirmationServiceProvider} from './ConfirmationService';
import ErrorBoundary from "./ErrorBoundary";
import Sidebar from './Sidebar';
import { SessionForm } from './SessionForm';

const App: React.FC = () => {

    // https://redux.js.org/basics/usage-with-react#passing-the-store
    const store = createStore(stateReducer)

    const query = new URLSearchParams(useLocation().search)

    return (
        <ErrorBoundary>
            <div className="App">
                <Provider store={store}>
                        <Switch>
                            <Route path="/table">
                                <ConfirmationServiceProvider>
                                    <DndProvider backend={Backend}>
                                        <Game sessionId={query.get("sessionId")} gameId={query.get("name")}/>
                                    </DndProvider>
                                    <Sidebar/>
                                </ConfirmationServiceProvider>
                            </Route>
                            <Route path="/room">
                                <RoomForm sessionId={query.get("sessionId")}/>
                            </Route>
                            <Route path="/">
                                <SessionForm/>
                            </Route>
                        </Switch>
                </Provider>
            </div>
        </ErrorBoundary>
    )
}

export default App