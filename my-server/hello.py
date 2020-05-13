import json
import logging
import socket
import sys
import typing

from flask import Flask, render_template
from flask import request
from flask_socketio import SocketIO, join_room, emit, send

# note that flask logs to stderr by default
from magic_models import JoinRequest
from magic_table import MagicTable
from test_table import test_table

IP = socket.gethostbyname(socket.gethostname())

app = Flask(__name__)
socketio = SocketIO(app,
                    cors_allowed_origins=[
                        'http://localhost:5000',  # necessary for flask served static js
                        'http://localhost:3000',  # necessary for static file server js
                        f'http://{IP}:3000',  # necessary for static file server js loaded on other machine
                        # '*'  # would allow clients served from anywhere, not a good idea
                    ])
# todo try ideas on https://github.com/facebook/create-react-app/issues/5280 instead of cors and these ports
# or https://create-react-app.dev/docs/proxying-api-requests-in-development/

tables: typing.Dict[str, MagicTable] = {}  # dict to track active tables


@app.route('/')
def index():
    """Serve the index HTML"""
    return render_template('index.html')


def get_table(table_name):
    if table_name in tables:  # check memory
        return tables[table_name]
    elif "test" in table_name and table_name[:4] == "test":
        tables[table_name] = test_table()
        return tables[table_name]
    else:
        table = MagicTable.load(table_name)  # check disk
        if table:
            tables[table_name] = table  # keep in memory
        return table


@app.route('/table/<path:table_name>', methods=['GET', 'POST'])
def join_table(table_name):
    table = get_table(table_name)
    if request.method == 'POST':
        if not table:
            table = MagicTable(table_name)  # create if joining
        app.logger.warning(request.data.decode('utf-8'))
        d = json.loads(request.data)
        join_request = JoinRequest(**d)
        if table.add_player(join_request):
            table.save()
            return "Joined table.", 201
        else:
            return "Already at table.", 409
    else:
        if table:
            return table.table.game.to_json()
        return "Table not found.", 404


@app.route('/table/<path:table_name>/cards', methods=['GET'])
def get_cards(table_name):
    table = get_table(table_name)
    if table:
        return table.get_cards()
    else:
        return "Table not found.", 404


@socketio.on('connect')
def test_connect():
    app.logger.warning(f'Client connected {{{request.method} {request.headers}}}')


@socketio.on('disconnect')
def test_disconnect():
    app.logger.warning(f'Client disconnected {{{request.method} {request.headers}}}')


@socketio.on('player_action')
def on_player_action(data):
    app.logger.info(f'player_action {data}')
    # todo store action for late joiners or refresh
    emit('player_action', data, broadcast=True)


@socketio.on('create')
def on_create(data):
    """Create a game lobby"""
    room = data['room']
    data['users'] = []
    tables[room] = data
    join_room(room)
    emit('join_room', {'room': room})
    app.logger.warning(room)


@socketio.on('join')
def on_join(data):
    """Join a game lobby"""
    username = data['username']
    room = data['room']

    if room in tables:
        # add player and rebroadcast game object
        # rooms[room].add_player(username)
        tables[room]['users'].append(username)
        join_room(room)
        send(tables[room], room=room, json=True)
        emit('joined', tables[room], json=True)  # on('joined'
        app.logger.warning("%s %s", data, room)
    else:
        emit('error', {'error': 'Unable to join room. Room does not exist.'})


@socketio.on('flip_card')
def on_flip_card(data):
    """flip card and rebroadcast game object"""
    room = data['room']
    card = data['card']
    tables[room]['flip_card'] = card
    send(tables[room], room=room)  # json=False means on('message'
    app.logger.warning("%s %s", data, room)


if __name__ == '__main__':
    logging.basicConfig(format='%(asctime)s %(message)s', stream=sys.stdout, level=logging.DEBUG)
    logging.info("hello from logging")
    socketio.run(app,
                 debug=True,
                 host='0.0.0.0')  # so that the server listens on the public network interface, else localhost
    logging.warning("goodbye world")
