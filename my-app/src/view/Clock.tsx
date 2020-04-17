import React from "react";
import ReactDOM from "react-dom";
import { Redirect } from "react-router-dom";

// I could re-write this to use https://reactjs.org/docs/hooks-effect.html but it'd be a waste of time.

interface ClockState {
    date: Date
}

export class Clock extends React.Component {
    timerID?: NodeJS.Timeout;
    state: ClockState
    constructor(props: Readonly<{}>) {
      super(props);
      this.state = {date: new Date()};
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.tick(),
            1000
          );
    }
  
    componentWillUnmount() {
        if(this.timerID)
            clearInterval(this.timerID);
    }

    tick() {
        this.setState({
          date: new Date()
        });
      }
  
    render() {
      return (
        <div style={{
          padding: "4pt",
          color: "brown"
        }}>
          {this.state.date.toLocaleTimeString()}
        </div>
      );
    }
  }
  
  ReactDOM.render(
    <Clock />,
    document.getElementById('root')
  );