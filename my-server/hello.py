# import eventlet
# eventlet.monkey_patch()
# ^^ monkey patching standard library necessary for using redis as socketio message queue
# best done as early as possible - https://flask-socketio.readthedocs.io/en/latest/#using-multiple-workers
# breaks debugger breakpoints, requires "gevent": true in launch.json else crashes in debugger

import argparse
import json
import logging
import os
import sys
import typing
from datetime import datetime

from flask import Flask, send_from_directory, jsonify
from flask import request
from flask_socketio import SocketIO, join_room, emit

from magic_models import JoinRequest, PlayerAction
from magic_table import MagicTable
from test_table import test_table
from collections import defaultdict
from threading import Lock

"""
To run from fresh checkout:
cd my-server
python3 -m venv "venv"
source venv/bin/activate
pip3 install -r requirements.txt
cd my-app; npm install
cd ..
cd scryfall; python3 updateCards.py; extractCards.sh
cd ..
cd my-server; genTsInterfaces.sh
cd ..
cd my-app; npm install; npm build  # must close IDEs while this runs, else linux npm has issues 

Run redis via:
windows powershell, bash -l, redis-server /home/linuxbrew/.linuxbrew/etc/redis.conf
monitor it via powershell, bash -l, redis-cli, monitor

Then run this file with the python path = my-server
Optionally run a dev ui from cd my-app;npm start
"""

tables: typing.Dict[str, MagicTable] = {}  # dict to track active tables
table_locks: typing.Dict[str, Lock] = defaultdict(Lock)

parser = argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=5000, required=False)
parser.add_argument("--static_port", type=int, default=3000, required=False)
parser.add_argument("--public_ip", type=str, default='0.0.0.0', required=False)
parser.add_argument("--redis", type=bool, default=False, required=False)
args = parser.parse_args()

app = Flask(__name__,
            static_folder=os.path.join('..', 'my-app', 'build'),
            # static_url_path='/' # see  @app.route('/'  below
            )
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
                    ],
                    # if using multiple server processes, need a queue, e.g. 
                    message_queue='redis://localhost:6379' if args.redis else None
                 )
# can specify all these port args for websocket (but not http api) development
# create react app proxy doesn't work with websocket https://github.com/facebook/create-react-app/issues/5280
# so i manually set the socketio port in MySocket.ts


def is_test(table_name: str) -> bool:
    table_name = table_name.lower()
    return "test" in table_name and table_name[:4] == "test"


def main():
    DEBUG = os.environ.get('FLASK_DEV', False)
    logging.info(f"starting up at http://{args.public_ip}:{args.port}")
    socketio.run(app,
                 debug=DEBUG,
                 host='0.0.0.0',  # so that the server listens on the public network interface, else localhost
                 port=args.port)


# gross, but the static_url_path='/' ends up messing with react-router quite a bit and 404'ing all routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path: str):
    if path.startswith('static'):
        return app.send_static_file(path)
    build_dir = os.path.abspath(os.path.join('..', 'my-app', 'build'))  # path react build
    if path != "" and os.path.exists(os.path.join(build_dir, path)):
        return send_from_directory(os.path.join(build_dir), path)
    else:
        return send_from_directory(os.path.join(build_dir), 'index.html')


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


if __name__ == '__main__':
    logging.basicConfig(format='%(asctime)s %(name)s %(levelname)s %(message)s', stream=sys.stdout, level=logging.INFO)
    import logging.handlers

    # note that flask logs to stderr by default
    # socket.io doesn't handle rotating file appender, gets stuck on old one after the move (at least on windows)
    os.makedirs(os.path.join('data', 'logs'), exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    h = logging.FileHandler(filename=os.path.join('data', 'logs', f'hello_{timestamp}.log'), mode='a')
    f = logging.Formatter('%(asctime)s %(name)s %(levelname)-8s %(message)s')
    h.setFormatter(f)
    logging.getLogger().addHandler(h)

    logging.info("hello from logging")
    main()
    logging.warning("goodbye world")
