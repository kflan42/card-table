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
from http import HTTPStatus
from threading import Thread

from flask import Flask
from flask import request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, emit

import persistence
from magic_cards import MagicCards
from magic_constants import GameException
from magic_models import JoinRequest, PlayerAction, Table, SFCard, TableInfo
from magic_room import MagicRoom
from utils import logger

magic_rooms: typing.Dict[str, MagicRoom] = {}
active_players: typing.Dict[str, typing.List[str]] = defaultdict(list)

# note that flask logs to stderr by default
if not persistence.GOOGLE_CLOUD_PROJECT:  # only log to file locally
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
        deck, sideboard = MagicCards.resolve_decklist(request.json)
        return {"deck": SFCard.schema().dump(deck, many=True),
                "sideboard": SFCard.schema().dump(sideboard, many=True)}
    except Exception as e:
        logger.warning(e)
        return str(e), 400


@app.route('/api/session/<path:session_id>/tables', methods=['GET'])
def get_tables_info(session_id: str):
    tables_info = magic_rooms.setdefault(session_id, MagicRoom(session_id)).get_tables_info()
    return TableInfo.schema().dumps(tables_info, many=True)


@app.route('/api/session/<path:session_id>/tables/<path:table_name>', methods=['PUT'])
def create_table(table_name: str, session_id: str):
    table_name = table_name.lower()  # lower case table names since windows filesystem case-insensitive
    r = magic_rooms.setdefault(session_id, MagicRoom(session_id)).create_table(table_name)
    _emit_tables_update(session_id)
    return r


def _emit_tables_update(session_id):
    tables_info = magic_rooms[session_id].get_tables_info()
    socketio.emit('room_update', {'data': [ti.to_dict() for ti in tables_info]}, room=session_id)
    logger.info(f"emitted room_update to room={session_id}")


@app.route('/api/session/<path:session_id>/table/<path:table_name>', methods=['GET', 'PUT'])
def join_table(table_name: str, session_id: str):
    table_name = table_name.lower()  # lower case table names since windows filesystem case-insensitive
    if request.method == 'PUT':
        try:
            logger.info(request.data.decode('utf-8'))
            d = json.loads(request.data)
            join_request: JoinRequest = JoinRequest.schema().load(d)
            x = magic_rooms.setdefault(session_id, MagicRoom(session_id)).join_table(table_name, join_request)
            if x[1] == HTTPStatus.ACCEPTED:
                # send a message about it so other players reload table and cards needed
                socketio.emit('joined_table', {'name': join_request.name},
                              room=session_id + '/' + table_name)  # on('joined_table'
                _emit_tables_update(session_id)
            return x
        except GameException as e:
            logger.warning(e)
            return "Error joining table: " + str(e), 400
    elif request.method == 'GET':
        x = magic_rooms.setdefault(session_id, MagicRoom(session_id)).get_table(table_name)
        if isinstance(x, Table):
            return x.to_dict()
        return x


@app.route('/api/session/<path:session_id>/table/<path:table_name>/cards', methods=['GET'])
def get_cards(table_name, session_id):
    return magic_rooms.setdefault(session_id, MagicRoom(session_id)).get_cards(table_name)


@app.after_request
def add_header(response):
    response.cache_control.no_cache = True  # ensure if multiple players join quickly that GET cards isn't stale
    return response


def _add_player(where, sid):
    active_players[where].append(sid)


def _remove_player(sid):
    for _list in active_players.values():
        if sid in _list:
            _list.remove(sid)


@socketio.on('connect')
def test_connect():
    logger.info(f'Client {request.sid} connected via {request.referrer} from {request.remote_addr}')


@socketio.on('disconnect')
def test_disconnect():
    logger.info(f'Client {request.sid} disconnected via {request.referrer} from {request.remote_addr}')
    _remove_player(request.sid)


@socketio.on('player_action')
def on_player_action(data) -> bool:
    logger.info('player_action %s', data)
    table_name = data['table']
    session_id = data['session']
    player_action: PlayerAction = PlayerAction.schema().load(data['action'])
    try:
        x = magic_rooms.setdefault(session_id, MagicRoom(session_id)).player_action(table_name, player_action)
        if x:
            emit('game_update', x.to_dict(),
                 room=session_id+'/'+table_name, broadcast=True)  # on('game_update'
        return True  # always ack, sometimes update
    except Exception:
        emit('table_error', {'error': 'Action failed.'})
        logger.exception("Exception handling PlayerAction")
        return False


@socketio.on('player_draw')
def on_player_draw(data) -> bool:
    return on_info_event('player_draw', data)


@socketio.on('next_turn')
def on_next_turn(data) -> bool:
    return on_info_event('next_turn', data)


def on_info_event(event, data) -> bool:
    logger.info('%s %s', event, data)
    table_name = data['table']
    session_id = data['session']
    # send it out
    emit(event, data, room=session_id+'/'+table_name, broadcast=True)  # on(event
    # don't need to store info events
    return True


@socketio.on('error_report')
def on_error_report(data) -> bool:
    logger.error(f'error_report via {request.referrer} from {request.remote_addr} %s', data)
    return True


@socketio.on('join_room')
def on_join_room(data):
    """Join a table, which has its own socket.io room."""
    logger.info("join %s", data)
    session_id = data['session']

    # put client into socket.io room
    join_room(session_id)
    _add_player(session_id, request.sid)
    logger.info(f"{request.sid} joined room for {session_id}")


@socketio.on('join_table')
def on_join_table(data):
    """Join a table, which has its own socket.io room."""
    logger.info("join %s", data)
    table_name = data['table']
    session_id = data['session']
    # put client into socket.io room
    join_room(session_id+'/'+table_name)
    _add_player(session_id+'/'+table_name, request.sid)
    _emit_tables_update(session_id)


@app.route('/_ah/warmup')
def warmup():
    # google cloud will call this, return then kick off card data load in background
    Thread(target=lambda: logger.info(f"Loaded Forest: {MagicCards.find_card('Forest')}")).run()
    return '', 200, {}


def main():
    base_ip = os.environ.get('BASE_IP', '0.0.0.0')
    base_port = int(os.environ.get('BASE_PORT', 9000))
    debug = bool(os.environ.get('FLASK_DEV', False))

    logger.info(f"starting up at http://{base_ip}:{base_port}")
    socketio.run(app,
                 debug=debug,
                 log_output=debug,
                 use_reloader=False,
                 host=base_ip,
                 port=base_port)


if __name__ == '__main__':
    main()
    logger.warning("goodbye world")
