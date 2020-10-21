"""
Main entry point to launch server and handle client requests.
"""

# import eventlet
# eventlet.monkey_patch()
# ^^ monkey patching standard library necessary for using redis as socketio message queue
# best done as early as possible - https://flask-socketio.readthedocs.io/en/latest/#using-multiple-workers
# breaks debugger breakpoints, requires "gevent": true in launch.json else crashes in debugger

import json
import os
import typing
from collections import defaultdict
from datetime import datetime
from threading import Lock

from flask import Flask, jsonify
from flask import request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, emit

import persistence
from magic_cards import MagicCards
from magic_constants import GameException
from magic_models import JoinRequest, PlayerAction, Table, SFCard, TableInfo
from magic_table import MagicTable, is_test
from test_table import test_table
from utils import logger

tables: typing.Dict[str, MagicTable] = {}  # dict to track active tables
table_locks: typing.Dict[str, Lock] = defaultdict(Lock)

# note that flask logs to stderr by default
if persistence.LOCAL:  # only log to file locally
    import logging
    # socket.io doesn't handle rotating file appender, gets stuck on old one after the move (at least on windows)
    os.makedirs(os.path.join('logs'), exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    h = logging.FileHandler(filename=os.path.join('logs', f'hello_{timestamp}.log'), mode='a')
    f = logging.Formatter('%(asctime)s %(name)s %(levelname)-8s %(message)s')
    h.setFormatter(f)
    logger.addHandler(h)
logger.info("hello from logger")

app = Flask(__name__)

CORS(app)  # necessary for api in app engine and frontend in storage bucket

socketio = SocketIO(app,
                    cors_allowed_origins='*',  # allow clients served from anywhere, fine for a casual came for now
                    # disable websockets since google cloud app engine standard env doesn't support them
                    # and timing out on attempting them adds a second or two to each request
                    allow_upgrades=False
                    )
# can specify all these port args for websocket (but not http api) development
# create react app proxy doesn't work with websocket https://github.com/facebook/create-react-app/issues/5280
# so i manually set the socketio port in MySocket.ts


@app.route('/api/deckList', methods=['PUT'])
def parse_deck_list():
    try:
        cards = MagicCards.resolve_deck(request.json)
        return SFCard.schema().dumps(cards, many=True)
    except Exception as e:
        logger.warning(e)
        return str(e), 400


@app.route('/api/tables', methods=['GET'])
def get_tables_info():
    tables_info = [TableInfo(t.table.name, [p.color for p in t.table.game.players]) for t in tables.values()]
    tables_info.append(TableInfo(f"test-{len(tables_info)}", []))
    return TableInfo.schema().dumps(tables_info, many=True)


@app.route('/api/tables/<path:table_name>', methods=['PUT'])
def create_table(table_name: str):
    table_name, magic_table = get_table(table_name=table_name)
    if request.method == 'PUT':
        with table_locks[table_name]:
            if not magic_table:
                magic_table = MagicTable(table_name)  # create if joining
                logger.info("created table " + table_name)
                tables[table_name] = magic_table
                return "Created table", 201
            else:
                return f"{table_name} already exists.", 409
    else:
        return "Unrecognized method for this endpoint.", 400


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
        logger.info("loaded table " + table_name)
        if table:
            tables[table_name] = table  # keep in memory
        return table_name, table


@app.route('/api/table/<path:table_name>', methods=['GET', 'PUT'])
def join_table(table_name: str):
    table_name, magic_table = get_table(table_name=table_name)
    if request.method == 'PUT':
        try:
            logger.info(request.data.decode('utf-8'))
            # todo - this will work for single process dev server but not multi process prod
            with table_locks[table_name]:
                d = json.loads(request.data)
                join_request = JoinRequest.schema().load(d)
                if [p for p in magic_table.table.game.players if p.name == join_request.name]:
                    return "Already at table", 200
                if magic_table.add_player(join_request):
                    return "Joined table.", 202
        except GameException as e:
            logger.warning(e)
            return "Error joining table: " + str(e), 400
        except Exception as e:
            logger.exception(e)
            return "Error joining table: " + str(e), 500
    else:
        if magic_table:
            table = magic_table.table
            return Table(name=table.name, game=table.game, sf_cards=[], table_cards=table.table_cards,
                         actions=[], log_lines=table.log_lines).to_dict()
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


@app.after_request
def add_header(response):
    response.cache_control.no_cache = True  # ensure if multiple players join quickly that GET cards isn't stale
    return response


@socketio.on('connect')
def test_connect():
    logger.info(f'Client connected via {request.referrer} from {request.remote_addr}')


@socketio.on('disconnect')
def test_disconnect():
    logger.info(f'Client disconnected via {request.referrer} from {request.remote_addr}')


@socketio.on('player_action')
def on_player_action(data):
    logger.info('player_action %s', data)
    table_name = data['table']
    table_name, table = get_table(table_name=table_name)
    if table:
        # warning this will work for single process dev server but not multi process production setup
        with table_locks[table_name]:
            player_action = PlayerAction.schema().load(data)
            # resolve action
            game_update, log_lines, table_cards = table.resolve_action(player_action)
            if game_update:
                # send it out
                table_update = Table(name=table_name, game=game_update, sf_cards=[], table_cards=table_cards,
                                     actions=[], log_lines=log_lines).to_dict()
                emit('game_update', table_update, room=table_name, broadcast=True)  # on('game_update'
            else:
                emit('error', {'error': 'Action failed.'})
    else:
        emit('error', {'error': 'Unable to do action. Table does not exist.'})
        return False
    return True


@socketio.on('player_draw')
def on_player_draw(data):
    on_info_event('player_draw', data)


@socketio.on('next_turn')
def on_player_draw(data):
    on_info_event('next_turn', data)


def on_info_event(event, data):
    logger.info('%s %s', event, data)
    table_name = data['table']
    table_name, table = get_table(table_name=table_name)
    if table:
        # todo - this will work for single process server but not multi process
        with table_locks[table_name]:
            # send it out
            emit(event, data, room=table_name, broadcast=True)
            # don't need to store info events
    else:
        emit('error', {'error': 'Unable to do action. Table does not exist.'})
        return False
    return True


@socketio.on('error_report')
def on_error_report(data):
    logger.error(f'error_report via {request.referrer} from {request.remote_addr} %s', data)


@socketio.on('join')
def on_join(data):
    """Join a table, which has its own socket.io room."""
    logger.info("join %s", data)
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


@app.route('/_ah/warmup')
def warmup():
    # google cloud will call this. could load card data here, but better to be lazy for now.
    return '', 200, {}


def main():
    base_ip = os.environ.get('BASE_IP', 'localhost')  # 0.0.0.0 to listen on external network interface instead
    base_port = os.environ.get('BASE_PORT', 5000)
    debug = os.environ.get('FLASK_DEV', False)

    logger.info(f"starting up at http://{base_ip}:{base_port}")
    socketio.run(app,
                 debug=debug,
                 host=base_ip,
                 port=base_port)


if __name__ == '__main__':
    main()
    logger.warning("goodbye world")
