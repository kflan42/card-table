import json
import logging
import os


class MagicTable:
    tables_path = None

    @staticmethod
    def initialize():
        # lazy class init
        if MagicTable.tables_path:
            return  # already done
        MagicTable.tables_path = os.path.join('data', 'tables')
        os.makedirs(MagicTable.tables_path, exist_ok=True)

    @staticmethod
    def load(table_name):
        MagicTable.initialize()
        file_path = os.path.join(MagicTable.tables_path, table_name)
        if os.path.isfile(file_path):
            with open(file_path, mode='r') as f:
                data = json.load(f)
                return MagicTable(table_name, data)
        else:
            return None

    def __init__(self, name, data={}):
        self.name = name
        self.data = data

    def add_player(self, player_data):
        self.data[player_data['name']] = player_data

    def save(self):
        MagicTable.initialize()
        file_path = os.path.join(MagicTable.tables_path, self.name)
        with open(file_path, mode='w') as f:
            json.dump(self.data, f)

    def get_data(self):
        return self.data


def load_cards():
    with open(os.path.join('data', 'my-cards.json')) as f:
        card_db = json.load(f)
        logging.info(f"Cards loaded, eg {card_db[0]}")
        return card_db
