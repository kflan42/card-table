import json
import logging
import os
import random
import re
import time
from collections import defaultdict
from typing import List, Tuple, Optional

from magic_models import SFCard


class MagicTable:
    _tables_path = None
    _card_map = None

    @staticmethod
    def get_tables_path():
        # lazy class init
        if not MagicTable._tables_path:
            MagicTable._tables_path = os.path.join('data', 'tables')
            os.makedirs(MagicTable._tables_path, exist_ok=True)
            logging.info("Tables initialized. Tables on disk: " + ",".join(os.listdir(MagicTable._tables_path)))
        return MagicTable._tables_path

    @staticmethod
    def get_card_map():
        if not MagicTable._card_map:
            MagicTable._card_map = load_cards() + load_cards("tokens")
        return MagicTable._card_map

    @staticmethod
    def load(table_name):
        file_path = os.path.join(MagicTable.get_tables_path(), table_name)
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
        deck = parse_deck(player_data['deck'])
        cr = CardResolver(MagicTable.get_card_map())
        player_data['deck'] = [cr.find_card(*c) for c in deck]
        self.data[player_data['name']] = player_data
        # todo load deck onto table, resolve card names into specific cards to store in table

    def save(self):
        file_path = os.path.join(MagicTable.get_tables_path(), self.name)
        with open(file_path, mode='w') as f:
            json.dump(self.data, f)

    def get_data(self):
        return self.data


def load_cards(what="cards") -> List[SFCard]:
    with open(os.path.join('..', 'my-app', 'public', f'my-{what}.json')) as f:
        t0 = time.time()
        # too slow card_list = [CardSchema().load(c) for c in json.load(f)]
        # this is about 50x faster, bypassing Schema logic
        pattern = re.compile(r'(?<!^)(?=[A-Z])')

        def load_card(d: dict):
            # camelCase to snake case the dict
            for k in d:
                nk = pattern.sub('_', k).lower()
                if nk != k:
                    v = d[k]
                    del d[k]
                    d[nk] = v
            return SFCard(**d)

        card_list = [load_card(c) for c in json.load(f)]
        # cards = {c.id: c for c in card_list}
        t1 = time.time()
        logging.info(f"{len(card_list)} {what} loaded in {t1 - t0:.3f}s, eg {card_list[0]}")
        return card_list


class CardResolver:

    def __init__(self, cards: List[SFCard]):
        # build map
        self.card_map = defaultdict(lambda: defaultdict(list))
        for card in cards:
            if card.face:
                self.card_map[card.name][card.set_name].append(card)
            elif card.faces:
                for face in card.faces:
                    self.card_map[face][card.set_name].append(card)
            else:
                logging.error('Failed to map %s', card)

    def find_card(self, name, set_name=None, number=None) -> SFCard:
        try:
            name_map = self.card_map[name]
            official_set = set_name and len(set_name) == 3
            if official_set and number and set_name in name_map:
                matches = [cd for cd in name_map[set_name] if cd.number == number]
                if matches:
                    return matches[0]
            if official_set and set_name and set_name in name_map:
                return random.choice(name_map[set_name])
            # fall through if number or set not found
            random_set = random.choice(list(name_map.values()))
            return random.choice(random_set)
        except LookupError:
            logging.exception("Card data not found for %s %s %s", name, set_name, number)


def parse_deck(deck_text: str) -> List[Tuple[str, Optional[str], Optional[str]]]:
    cards = []
    for line in deck_text.strip().splitlines():
        card_parts = line.strip().split(" ")
        count = int(card_parts[0].replace("r", "").replace("x", ""))
        set_name = None
        set_number = None
        if len(card_parts) > 3:  # count "name" (set) num // plus spaces in name
            m = re.match(r'\((\w+)\)', card_parts[-2])
            if m:
                set_name = m[1].lower()
                set_number = card_parts[-1].lower()  # not always numeric
        if len(card_parts) > 2:  # count "name" (set) // plus spaces in name
            m = re.match(r'\((\w+)\)', card_parts[-1])
            if m:
                set_name = m[1].lower()
                # no set number if set last
        # else just count "name" // plus spaces in name
        name_parts = len(card_parts) - 1 - (1 if set_name else 0) - (1 if set_number else 0)
        name = " ".join(card_parts[1: name_parts + 1])
        for _ in range(count):
            cards.append((name, set_name, set_number))
    return cards
