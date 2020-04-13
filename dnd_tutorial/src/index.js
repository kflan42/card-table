import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import ExampleCard from './ExampleCard';
import ExampleBoard from './ExampleBoard';
import { observe } from './ExampleGame'


// ReactDOM.render(
//   <React.StrictMode>
//     {/* <App /> */}
//     {/* <ExampleCard /> */}
//     <Board knightPosition={[0, 0]} />,
//   </React.StrictMode>,
//   document.getElementById('root')
// );

const root = document.getElementById('root')

observe(knightPosition =>
  ReactDOM.render(
    <div style={{width: 800, height:800, border: '1px solid gray'}}>
  <ExampleBoard knightPosition={knightPosition} />
    </div>
  , root),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
