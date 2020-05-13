import socketIOClient from "socket.io-client";


export default class MySocket {

    private static socket: SocketIOClient.Socket | null = null

    static get_socket() {
        if (this.socket === null) {
            console.log('creating socket')
            const socketIoUrl = window.location.protocol + "//" + window.location.host.replace('3000', '5000')
            //+ "/" + window.location.pathname + window.location.search
            this.socket = socketIOClient(socketIoUrl)
        }
        return this.socket
    }

}
