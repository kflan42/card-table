"""
Main entry point to launch server and handle client requests.
"""

# import eventlet
# eventlet.monkey_patch()
# ^^ monkey patching standard library necessary for using redis as socketio message queue
# best done as early as possible - https://flask-socketio.readthedocs.io/en/latest/#using-multiple-workers
# breaks debugger breakpoints, requires "gevent": true in launch.json else crashes in debugger

import argparse
import json
import logging
import logging.handlers
import os
import sys
import typing
from datetime import datetime

from flask import Flask, send_from_directory, jsonify
from flask import request
from flask_socketio import SocketIO, join_room, emit

import persistence
from magic_models import JoinRequest, PlayerAction
from magic_table import MagicTable
from test_table import test_table
from collections import defaultdict
from threading import Lock

tables: typing.Dict[str, MagicTable] = {}  # dict to track active tables
table_locks: typing.Dict[str, Lock] = defaultdict(Lock)

DEBUG = os.environ.get('FLASK_DEV', False)
LOCAL_FILES = os.environ.get('LOCAL_FILES', False) or DEBUG

# local vs cloud storage
if LOCAL_FILES:
    persistence.LOCAL = True

if DEBUG:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5000, required=False)
    parser.add_argument("--static_port", type=int, default=3000, required=False)
    parser.add_argument("--public_ip", type=str, default='0.0.0.0', required=False)
    parser.add_argument("--redis", type=bool, default=False, required=False)
    parser.add_argument("--static_folder", type=str, default="../my-app/build", required=False)
    args = parser.parse_args()  # breaks gunicorn
else:
    class Args:
        def __init__(self):
            self.port = 8000  # gunicorn default
            self.static_port = 3000  # npm react start default
            self.public_ip = '0.0.0.0'
            self.redis = False
    args = Args()

# logging setup
logging.basicConfig(format='%(asctime)s %(name)s %(levelname)s %(message)s', stream=sys.stdout, level=logging.INFO)
# note that flask logs to stderr by default
if LOCAL_FILES:  # only log to file locally
    # socket.io doesn't handle rotating file appender, gets stuck on old one after the move (at least on windows)
    os.makedirs(os.path.join('logs'), exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    h = logging.FileHandler(filename=os.path.join('logs', f'hello_{timestamp}.log'), mode='a')
    f = logging.Formatter('%(asctime)s %(name)s %(levelname)-8s %(message)s')
    h.setFormatter(f)
    logging.getLogger().addHandler(h)
logging.info("hello from logging")

app = Flask(__name__,
            static_folder='build/static',
            static_url_path='/static/')
# static_url_path='/' # see  @app.route('/'  below
# no cors for flask http api unless using https://flask-cors.readthedocs.io/en/latest/ which I don't need
# for production, I can npm build the frontend and serve it from flask, avoiding CORS issues
# not needed for local dev http requests if using create react app package.json's proxy setting


socketio = SocketIO(app,
                    cors_allowed_origins=[
                        f'http://localhost:{args.port}',  # local flask served static js
                        f'http://localhost:{args.static_port}',  # local static file server js
                        f'http://{args.public_ip}:{args.port}',  # from remote machine
                        f'http://{args.public_ip}:{args.static_port}',
                        # '*'  # would allow clients served from anywhere, not a good idea
                    ] if DEBUG else None,
                    # if using multiple server processes, need a queue, e.g. 
                    message_queue='redis://localhost:6379' if args.redis else None
                 )
# can specify all these port args for websocket (but not http api) development
# create react app proxy doesn't work with websocket https://github.com/facebook/create-react-app/issues/5280
# so i manually set the socketio port in MySocket.ts


def is_test(table_name: str) -> bool:
    table_name = table_name.lower()
    return "test" in table_name and table_name[:4] == "test"


@app.route('/')
def hello_world():
    return "Hello World!!!", 200


@app.route('/<path:path>')
def serve(path: str):
    """handle everything that's not static and not an api request"""
    build_folder = 'build'
    if path != "" and os.path.exists(os.path.join(build_folder, path)):
        return send_from_directory(build_folder, path)
    elif path == "login" or path.startswith("table/"):
        return send_from_directory(build_folder, 'index.html')
    else:
        return "File not found.", 404


def get_table(table_name) -> typing.Tuple[str, MagicTable]:
    table_name = table_name.lower()  # lower case table names since windows filesystem case insensitive
    if table_name in tables:  # check memory
        return table_name, tables[table_name]
    elif is_test(table_name):
        table = test_table(table_name)
        tables[table_name] = table
        return table_name, table
    else:
        table = MagicTable.load(table_name)  # check disk
        logging.info("loaded table " + table_name)
        if table:
            tables[table_name] = table  # keep in memory
        return table_name, table


@app.route('/api/table/<path:table_name>', methods=['GET', 'POST'])
def join_table(table_name: str):
    table_name, table = get_table(table_name=table_name)
    if request.method == 'POST':
        try:
            logging.info(request.data.decode('utf-8'))
            created = False
            # todo - this will work for single process dev server but not multi process prod
            with table_locks[table_name]:
                if not table:
                    table = MagicTable(table_name)  # create if joining
                    logging.info("created table " + table_name)
                    tables[table_name] = table
                    created = True
                d = json.loads(request.data)
                join_request = JoinRequest(**d)
                if table.add_player(join_request):
                    if not is_test(table_name):
                        table.save()
                    return ("Created table", 201) if created else ("Joined table.", 202)
                else:
                    return "Already at table.", 409
        except Exception as e:
            logging.exception(e)
            return "Error joining table: " + str(e), 500
    else:
        if table:
            return table.table.game.to_json()
        return {"message": "Table not found."}, 404


@app.route('/api/table/<path:table_name>/cards', methods=['GET'])
def get_cards(table_name):
    table_name, table = get_table(table_name)
    if table:
        return table.get_cards()
    else:
        return "Table not found.", 404


@app.route('/api/table/<path:table_name>/actions', methods=['GET'])
def get_actions(table_name):
    table_name, table = get_table(table_name)
    if table:
        return jsonify(table.get_actions())
    else:
        return "Table not found.", 404


@socketio.on('connect')
def test_connect():
    logging.info(f'Client connected via {request.referrer} from {request.remote_addr}')


@socketio.on('disconnect')
def test_disconnect():
    logging.info(f'Client disconnected via {request.referrer} from {request.remote_addr}')


@socketio.on('player_action')
def on_player_action(data):
    logging.info('player_action %s', data)
    table_name = data['table']
    table_name, table = get_table(table_name=table_name)
    if table:
        # warning this will work for single process dev server but not multi process production setup
        with table_locks[table_name]:
            player_action = PlayerAction(**data)
            # resolve action
            game_update = table.resolve_action(player_action)
            if game_update:
                # send it out
                emit('game_update', game_update.to_json(), room=table_name, broadcast=True)   # on('game_update'
                if not is_test(table_name):  # don't save test tables
                    table.save()
            else:
                emit('error', {'error': 'Action failed.'})
    else:
        emit('error', {'error': 'Unable to do action. Table does not exist.'})
        return False
    return True


@socketio.on('player_draw')
def on_player_draw(data):
    logging.info('player_draw %s', data)
    table_name = data['table']
    table_name, table = get_table(table_name=table_name)
    if table:
        # todo - this will work for single process dev server but not multi process prod
        with table_locks[table_name]:
            # send it out
            emit('player_draw', data, room=table_name, broadcast=True)  # on('player_draw'
            # don't need to store draw
    else:
        emit('error', {'error': 'Unable to do action. Table does not exist.'})
        return False
    return True


@socketio.on('error_report')
def on_error_report(data):
    logging.error(f'error_report via {request.referrer} from {request.remote_addr} %s', data)


@socketio.on('join')
def on_join(data):
    """Join a table, which has its own socket.io room."""
    logging.info("join %s", data)
    table_name = data['table']
    table_name, table = get_table(table_name)
    if table:
        # todo - this will work for single process dev server but not multi process prod
        with table_locks[table_name]:
            # put client into socket.io room
            join_room(table_name)
            # send a message about it so other players reload table
            emit('joined', data, room=table_name, broadcast=True)  # on('joined'
    else:
        emit('error', {'error': 'Unable to join table. Table does not exist.'})


def main():
    logging.info(f"starting up at http://{args.public_ip}:{args.port}")
    socketio.run(app,
                 debug=DEBUG,
                 host='0.0.0.0',  # so that the server listens on the public network interface, else localhost
                 port=args.port)


if __name__ == '__main__':
    main()
    logging.warning("goodbye world")
