import argparse
import json
import logging
import os
import socket
import sys
import typing

from flask import Flask, send_from_directory, jsonify
from flask import request
from flask_socketio import SocketIO, join_room, emit

# note that flask logs to stderr by default
from magic_models import JoinRequest
from magic_table import MagicTable
from test_table import test_table


# to run from fresh checkout
# -1 setup venv for py
# 0 setup npm stuff (maybe not necessary)
# 1 scryfall/extractCards.sh
# 2 my-server/genTsInterfaces.sh
# 3 my-app npm build
# then run this

def is_test(table_name: str) -> bool:
    return "test" in table_name and table_name[:4] == "test"

def main(args: argparse.Namespace):
    ip = socket.gethostbyname(socket.gethostname())

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
                            f'http://{ip}:{args.port}',  # from other local machine
                            f'http://{ip}:{args.static_port}',
                            f'http://{args.public_ip}:{args.port}',  # from remote machine
                            f'http://{args.public_ip}:{args.static_port}',
                            # '*'  # would allow clients served from anywhere, not a good idea
                        ])
    # can specify all these port args for websocket (but not http api) development
    # create react app proxy doesn't work with websocket https://github.com/facebook/create-react-app/issues/5280
    # so i manually set the socketio port in MySocket.ts

    tables: typing.Dict[str, MagicTable] = {}  # dict to track active tables

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

    def get_table(table_name):
        if table_name in tables:  # check memory
            return tables[table_name]
        elif is_test(table_name):
            tables[table_name] = test_table()
            return tables[table_name]
        else:
            table = MagicTable.load(table_name)  # check disk
            if table:
                tables[table_name] = table  # keep in memory
            return table

    @app.route('/api/table/<path:table_name>', methods=['GET', 'POST'])
    def join_table(table_name):
        table = get_table(table_name)
        if request.method == 'POST':
            if is_test(table_name):
                return "Can't join test tables.", 400
            logging.info(request.data.decode('utf-8'))
            if not table:
                table = MagicTable(table_name)  # create if joining
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

    @app.route('/api/table/<path:table_name>/cards', methods=['GET'])
    def get_cards(table_name):
        table = get_table(table_name)
        if table:
            return table.get_cards()
        else:
            return "Table not found.", 404

    @app.route('/api/table/<path:table_name>/actions', methods=['GET'])
    def get_actions(table_name):
        table = get_table(table_name)
        if table:
            return jsonify(table.get_actions())
        else:
            return "Table not found.", 404

    @socketio.on('connect')
    def test_connect():
        logging.info(f'Client connected {{{request.method} {request.headers}}}')

    @socketio.on('disconnect')
    def test_disconnect():
        logging.info(f'Client disconnected {{{request.method} {request.headers}}}')

    @socketio.on('player_action')
    def on_player_action(data):
        logging.info('player_action %s', data)
        table_name = data['table']
        table = get_table(table_name=table_name)
        if table:
            # send it out
            emit('player_action', data, room=table_name, broadcast=True)   # on('player_action'
            # store action for late joiners or refresh
            table.add_action(data)
            if not is_test(table_name):  # don't save test tables
                table.save()
        else:
            emit('error', {'error': 'Unable to do action. Table does not exist.'})

    @socketio.on('join')
    def on_join(data):
        """Join a table, which has its own socket.io room."""
        logging.info("join %s", data)
        table_name = data['table']
        table = get_table(table_name)
        if table:
            # put client into socket.io room
            join_room(table_name)
            # send a message about it so other players reload table
            emit('joined', data, room=table_name, broadcast=True)  # on('joined'
        else:
            emit('error', {'error': 'Unable to join table. Table does not exist.'})

    socketio.run(app,
                 debug=True,
                 host='0.0.0.0',  # so that the server listens on the public network interface, else localhost
                 port=args.port)
    # todo figure out how to run this insecure code safely before forwarding traffic through router


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5000, required=False)
    parser.add_argument("--static_port", type=int, default=3000, required=False)
    parser.add_argument("--public_ip", type=str, default='0.0.0.0', required=False)
    args = parser.parse_args()

    logging.basicConfig(format='%(asctime)s %(name)s %(levelname)s %(message)s', stream=sys.stdout, level=logging.INFO)
    import logging.handlers

    h = logging.handlers.RotatingFileHandler(filename='hello.log', mode='a', maxBytes=1e6, backupCount=10)
    f = logging.Formatter('%(asctime)s %(name)s %(levelname)-8s %(message)s')
    h.setFormatter(f)
    logging.getLogger().addHandler(h)

    logging.info("hello from logging")
    main(args)
    logging.warning("goodbye world")
