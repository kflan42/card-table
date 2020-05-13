import React, {useState, useEffect} from "react";
import socketIOClient from "socket.io-client";


const Sockets: React.FC = () => {


    const [response, setResponse] = useState<object[]>([]);
    const [response2, setResponse2] = useState<object[]>([]);

    const socketIoUrl = window.location.protocol + "//" + window.location.host.replace('3000', '5000')
    //+ "/" + window.location.pathname + window.location.search
    const socket = socketIOClient(socketIoUrl);

    useEffect(() => {
        socket.on('connect', function () {
            console.log('Websocket connected!');
        });
        socket.on('disconnect', function () {
            console.log('Websocket disconnected!');
        });


        socket.on('message', function (msg: object) {
            console.log('message', msg)
            setResponse(r => [...r, msg])
        });
        socket.on('json', function (msg: object) {
            console.log('json', msg)
            setResponse2(r => [...r, msg])
        });

        socket.on('error', function (msg: object) {
            console.warn('error', msg);
        });
        socket.on('join_room', function (msg: object) {
            console.log('join_room', msg);
        });
        socket.on('joined', function (msg: object) {
            console.log('joined', msg);
        });
    }, [socket]);


    /* eslint-disable jsx-a11y/accessible-emoji */
    return (
        <div style={{
            padding: "0.1em",
            color: "black",
            textAlign: "center"
        }}>
            <button onClick={() => socket.emit('create', {room: 'test1', a: 2, b: 'Simple'})}>Create</button>
            <button onClick={() => socket.emit('join', {room: 'test1', username: 'x'})}>Join</button>
            <button onClick={() => socket.emit('flip_card', {room: 'test1', card: response.length})}>Flip</button>
            {response.map(r => JSON.stringify(r) + "\n").map(s => <p key={s}>{s}</p>)}
            <p key='----'>----</p>
            {response2.map(r => JSON.stringify(r) + "\n").map(s => <p key={s}>{s}</p>)}
        </div>
    );
}

export default Sockets
