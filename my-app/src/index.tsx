
import ReactDOM from 'react-dom'
import React from 'react'
import App from './view/App'
import { BrowserRouter as Router } from 'react-router-dom'


const rootElement = document.getElementById('root')
ReactDOM.render(
    <Router>
    <App />
    </Router>, rootElement)
