import React, {ErrorInfo} from "react";
import MySocket from "../MySocket";

interface S {
    error: any,
    errorInfo: any
}

export default class ErrorBoundary extends React.Component<any, S> {
    constructor(props: object) {
        super(props);
        this.state = {error: null, errorInfo: null};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
        // You can also log the error to an error reporting service
        MySocket.get_socket().emit('error_report', {error, errorInfo});
    }

    render() {
        if (this.state.errorInfo) {
            // Error path
            return (
                <div>
                    <h2>Something went wrong.</h2>
                    <details style={{whiteSpace: 'pre-wrap'}}>
                        {this.state.error && this.state.error.toString()}
                        <br/>
                        {this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }
        // Normally, just render children
        return this.props.children;
    }
}