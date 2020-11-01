import typing
from datetime import  date
from http import HTTPStatus

from magic_models import JoinRequest, PlayerAction, Table, TableInfo
from magic_table import MagicTable, is_test
from test_table import test_table
from utils import logger


class MagicRoom:

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.tables: typing.Dict[str, MagicTable] = {}

    def get_tables_info(self):
        # live tables
        tables_info = [TableInfo(t, 'today', [p.color for p in self.tables[t].table.game.players]) for t in
                       self.tables.keys()]

        # storage tables
        file_tables = MagicTable.list_table_files(self.session_id)
        file_tables.sort(key=lambda ft: -ft[1])
        for (table_name, updated) in file_tables:
            if not any(t.table == table_name for t in tables_info):
                tables_info.append(TableInfo(table_name, date.fromtimestamp(updated).strftime("%m/%d"), []))

        return tables_info

    def create_table(self, table_name:str):
        if table_name in self.tables:
            return f"{table_name} already exists.", HTTPStatus.CONFLICT
        elif self._try_load_table(table_name):
            return f"{table_name} loaded from storage.", HTTPStatus.ACCEPTED
        elif is_test(table_name):
            table = test_table(table_name)
            self.tables[table_name] = table
            return f"Created Test Table {table_name}", HTTPStatus.CREATED
        else:
            magic_table = MagicTable(table_name, session_id=self.session_id)
            logger.info(f"created session/table {self.session_id}/{table_name}")
            self.tables[table_name] = magic_table
            return "Created table", HTTPStatus.CREATED

    def get_table(self, table_name: str):
        if table_name not in self.tables and not self._try_load_table(table_name):
            return "Table not found.", HTTPStatus.NOT_FOUND
        table = self.tables[table_name].table
        return Table(game=table.game, sf_cards=[],
                     table_cards=table.table_cards, actions=[], log_lines=table.log_lines)

    def _try_load_table(self, table_name) -> bool:
        if table_name in [t.table for t in self.get_tables_info()]:
            table = MagicTable.load(table_name, session_id=self.session_id)  # check disk
            if table:
                self.tables[table_name] = table  # keep in memory
                return True
            return False

    def join_table(self, table_name, join_request: JoinRequest):
        if table_name not in self.tables:
            return "Table not found.", HTTPStatus.NOT_FOUND
        magic_table = self.tables[table_name]
        if [p for p in magic_table.table.game.players if p.name == join_request.name]:
            return "Already at table", HTTPStatus.NO_CONTENT
        elif magic_table.add_player(join_request):
            return "Joined table.", HTTPStatus.ACCEPTED
        else:
            return "Failed to join table.", HTTPStatus.BAD_REQUEST

    def get_cards(self, table_name):
        if table_name not in self.tables:
            return "Table not found.", HTTPStatus.NOT_FOUND
        magic_table = self.tables[table_name]
        return magic_table.get_cards()

    def player_action(self, table_name: str, player_action: PlayerAction):
        game_update, log_lines, table_cards = self.tables[table_name].resolve_action(player_action)
        if game_update:
            # send it out
            table_update = Table(game=game_update, sf_cards=[],
                                 table_cards=table_cards, actions=[], log_lines=log_lines)
            return table_update
