import socketIOClient from "socket.io-client";


export default class MySocket {

    private static socket: SocketIOClient.Socket | null = null

    static get_socket() {
        if (this.socket === null) {
            let hostPort = window.location.host
            if (process.env.NODE_ENV === "development") {
                hostPort = hostPort.replace(RegExp(':\\d+$'), "")
                    + ":" + (process.env.REACT_APP_DYNAMIC_PORT || 5000);
            }
            let socketIOUrl = window.location.protocol
                + "//" + hostPort
            if (process.env.REACT_APP_API_URL) {
                socketIOUrl = process.env.REACT_APP_API_URL as string
            }
            console.log(`creating socket for ${socketIOUrl}`)
            this.socket = socketIOClient(socketIOUrl)
        }
        return this.socket
    }

    static close_socket() {
        if (this.socket !== null) {
            this.socket.close()
            this.socket = null
        }
    }

}
