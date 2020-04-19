import React from 'react'

import { DndProvider } from 'react-dnd'

import {
    BrowserRouter as Router,
    Switch,
    Route,
} from "react-router-dom";

import Backend from 'react-dnd-html5-backend'

import './myStyle.css';
import LoginForm from './Login'
import { createStore } from 'redux'
import { Provider } from 'react-redux';
import gameReducer from '../Reducers';
import Game from './Game';
import Log from './Log';

const App: React.FC = () => {

    // https://redux.js.org/basics/usage-with-react#passing-the-store
    const store = createStore(gameReducer)

    return (
        <div className="App">
            <Router>

                <Switch>
                    <Route path="/:gameId">
                        <Provider store={store}>    
                            <DndProvider backend={Backend}>
                            
                                <Game>
                                {/* todo build and swap in next component til screen is full */}
                                </Game>
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