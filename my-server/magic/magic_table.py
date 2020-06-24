import json
import logging
import os
from random import shuffle

from magic.magic_cards import load_cards, CardResolver, parse_deck
from magic.magic_models import SFCard, JoinRequest, Player, Card, Zone, ZONES, Game, LIBRARY, Table, Counter, EXILE, \
    COMMAND_ZONE


class MagicTable:
    _tables_path = None
    _cards = None
    _tokens = None

    @staticmethod
    def get_tables_path():
        # lazy class init
        if not MagicTable._tables_path:
            MagicTable._tables_path = os.path.join('data', 'tables')
            os.makedirs(MagicTable._tables_path, exist_ok=True)
            logging.info("Tables initialized. Tables on disk: " + ",".join(os.listdir(MagicTable._tables_path)))
        return MagicTable._tables_path

    @staticmethod
    def get_all_cards():
        if not MagicTable._cards:
            MagicTable._cards = load_cards()
        return MagicTable._cards

    @staticmethod
    def get_all_tokens():
        if not MagicTable._tokens:
            MagicTable._tokens = load_cards("tokens")
        return MagicTable._tokens

    @staticmethod
    def load(table_name):
        file_path = os.path.join(MagicTable.get_tables_path(), table_name + ".json")
        if os.path.isfile(file_path):
            with open(file_path, mode='r') as f:
                data = json.load(f)
                return MagicTable(table_name, data)
        else:
            return None

    def __init__(self, name, data: dict = None):
        if data:
            self.table = Table.from_dict(data)
        else:
            self.table = Table(name=name, sf_cards=[], actions=[],
                               game=Game(cards=[], players=[], zones=[], battlefield_cards=[], action_log=[]))

    def add_player(self, join_request: JoinRequest):
        if [p for p in self.table.game.players if p.name == join_request.name]:
            return False  # already present

        table = self.table
        # load cards into table
        deck = parse_deck(join_request.deck_list)
        cr = CardResolver(MagicTable.get_all_cards())
        sf_cards = [cr.find_card(*c) for c in deck]
        table.sf_cards.extend(sf_cards)

        # setup player fields
        cid = len(table.game.cards)
        cards = [Card(card_id=cid + i, sf_id=s.sf_id, owner=join_request.name) for i, s in enumerate(sf_cards)]
        table.game.cards.extend(cards)

        zid = len(table.game.zones)
        zones = [Zone(name=z, z_id=zid + i, owner=join_request.name, cards=[]) for i, z in enumerate(ZONES)]
        table.game.zones.extend(zones)

        if len(cards) >= 100:
            # start with cards shuffled in library, last in command zone, extras in sideboard
            c_ids = [c.card_id for c in cards]
            library_cards = c_ids[:99]
            shuffle(library_cards)
            [z for z in zones if z.name == LIBRARY][0].cards.extend(library_cards)
            [z for z in zones if z.name == COMMAND_ZONE][0].cards.append(c_ids[-1])
        if len(c_ids) > 100:
            [z for z in zones if z.name == EXILE][0].cards.extend(c_ids[99:-1])
        z_ids = [z.z_id for z in zones]

        # setup player
        player = Player(name=join_request.name, color=join_request.color, counters=[], zones=z_ids)
        player.counters.append(Counter(name="Life", value=40))
        table.game.players.append(player)
        return True

    def add_action(self, action):
        self.table.actions.append(action)

    def save(self):
        file_path = os.path.join(MagicTable.get_tables_path(), self.table.name + ".json")
        with open(file_path, mode='w') as f:
            f.write(self.table.to_json())

    def get_actions(self):
        return self.table.actions

    def get_cards(self):
        return SFCard.schema().dumps(self.table.sf_cards + MagicTable.get_all_tokens(), many=True)


