import json
import logging
import os
import sys

from flask import Flask, render_template, url_for, jsonify
from flask import request

from flask_socketio import SocketIO, join_room, emit, send
from markupsafe import escape

import logging

# note that flask logs to stderr by default
logging.basicConfig(format='%(asctime)s %(message)s', stream=sys.stdout, level=logging.DEBUG)
logging.info("hello from logging")

app = Flask(__name__)
socketio = SocketIO(app)

logging.info("hello from logging after Flask and SocketIO")

tables = {}  # dict to track active tables
tables_path = os.path.join('data', 'tables')
os.makedirs(tables_path, exist_ok=True)

with open(os.path.join('data', 'my-cards.json')) as f:
    cardDB = json.load(f)
    logging.info(f"Cards loaded, eg {cardDB[0]}")


@app.route('/')
def index():
    """Serve the index HTML"""
    return render_template('index.html')  #


# todo token data will just be served statically

# todo convert to PUT: card names in, card data back
@app.route('/cards')
def cards():
    return jsonify(cardDB[:10])  # only automatically does dicts


@app.route('/table/<path:subpath>', methods=['GET', 'POST'])
def join_table(subpath):
    if request.method == 'POST':
        d = json.loads(request.data)
        app.logger.warning(d)
        table = init_table(subpath)
        # todo load deck onto table, resolve card names into specific cards to store in table
        table[d['name']] = d['color']
        save_table(subpath, table)
        return table
    else:
        return init_table(subpath)


def save_table(table_name, table_data):
    file_path = os.path.join(tables_path, table_name)
    with open(file_path, mode='w') as f:
        json.dump(table_data, f)


def init_table(table_name):
    file_path = os.path.join(tables_path, table_name)
    if table_name not in tables:
        if os.path.isfile(file_path):
            with open(file_path, mode='r') as f:
                tables[table_name] = json.load(f)
        else:
            tables[table_name] = {}
    return tables[table_name]


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
        emit('joined', tables[room], json=True)
        app.logger.warning("%s %s", data, room)
    else:
        emit('error', {'error': 'Unable to join room. Room does not exist.'})


@socketio.on('flip_card')
def on_flip_card(data):
    """flip card and rebroadcast game object"""
    room = data['room']
    card = data['card']
    tables[room]['flip_card'] = card
    send(tables[room], room=room)
    app.logger.warning("%s %s", data, room)


if __name__ == '__main__':
    logging.warning("in main")
    socketio.run(app, debug=True)
    logging.warning("goodbye world")
