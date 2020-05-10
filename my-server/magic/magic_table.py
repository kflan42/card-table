import json
import logging
import os
import random
import re
from collections import defaultdict
from typing import List, Tuple

from magic_models import Card, CardSchema


class MagicTable:
    tables_path = None
    _card_map = None

    @staticmethod
    def initialize():
        # lazy class init
        if MagicTable.tables_path:
            return  # already done
        MagicTable.tables_path = os.path.join('data', 'tables')
        os.makedirs(MagicTable.tables_path, exist_ok=True)
        logging.info("MagicTable initialized. Tables on disk: " + ",".join(os.listdir(MagicTable.tables_path)))

    @staticmethod
    def get_card_map():
        if not MagicTable._card_map:
            MagicTable._card_map = load_cards() + load_cards("tokens")
        return MagicTable._card_map

    @staticmethod
    def load(table_name):
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
        deck = parse_deck(player_data['deck'])
        cr = CardResolver(MagicTable.get_card_map())
        player_data['deck'] = [cr.find_card(*c) for c in deck]
        self.data[player_data['name']] = player_data

    def save(self):
        file_path = os.path.join(MagicTable.tables_path, self.name)
        with open(file_path, mode='w') as f:
            json.dump(self.data, f)

    def get_data(self):
        return self.data


def load_cards(what="cards"):
    with open(os.path.join('..', 'my-app', 'public', f'my-{what}.json')) as f:
        card_list = [CardSchema().load(c) for c in json.load(f)]
        # cards = {c.id: c for c in card_list}
        logging.info(f"{len(card_list)} Cards loaded, eg {card_list[0]}")
        return card_list


class CardResolver:

    def __init__(self, cards: List[Card]):
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

    def find_card(self, name, set_name=None, number=None) -> Card:
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


def parse_deck(deck_text: str) -> Tuple[str]:
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
