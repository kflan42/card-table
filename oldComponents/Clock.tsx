import React from "react";
import ReactDOM from "react-dom";

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
        <div>
          <h2>It is {this.state.date.toLocaleTimeString()}.</h2>
        </div>
      );
    }
  }
  
  ReactDOM.render(
    <Clock />,
    document.getElementById('root')
  );