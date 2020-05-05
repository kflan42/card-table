import json
import logging
import os
import sys

from flask import Flask, render_template, url_for
from flask_socketio import SocketIO, join_room, emit, send
from markupsafe import escape

app = Flask(__name__)
socketio = SocketIO(app)
ROOMS = {}  # dict to track active rooms


@app.route('/')
def index():
    """Serve the index HTML"""
    return render_template('index.html')  #


@socketio.on('create')
def on_create(data):
    """Create a game lobby"""
    room = data['room']
    data['users'] = []
    ROOMS[room] = data
    join_room(room)
    emit('join_room', {'room': room})
    app.logger.warning(room)


@socketio.on('join')
def on_join(data):
    """Join a game lobby"""
    username = data['username']
    room = data['room']

    if room in ROOMS:
        # add player and rebroadcast game object
        # rooms[room].add_player(username)
        ROOMS[room]['users'].append(username)
        join_room(room)
        send(ROOMS[room], room=room, json=True)
        emit('joined', ROOMS[room], json=True)
        app.logger.warning("%s %s", data, room)
    else:
        emit('error', {'error': 'Unable to join room. Room does not exist.'})


@socketio.on('flip_card')
def on_flip_card(data):
    """flip card and rebroadcast game object"""
    room = data['room']
    card = data['card']
    ROOMS[room]['flip_card'] = card
    send(ROOMS[room], room=room)
    app.logger.warning("%s %s", data, room)


if __name__ == '__main__':
    app.logger.warning("hello world")
    socketio.run(app, debug=True)
