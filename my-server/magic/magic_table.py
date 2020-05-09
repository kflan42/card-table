import json
import logging
import os
import random
import re
from collections import defaultdict


class MagicTable:
    tables_path = None
    card_map = None

    @staticmethod
    def initialize():
        # lazy class init
        if MagicTable.tables_path:
            return  # already done
        MagicTable.tables_path = os.path.join('data', 'tables')
        os.makedirs(MagicTable.tables_path, exist_ok=True)
        logging.info("MagicTable initialized. Tables on disk: " + ",".join(os.listdir(MagicTable.tables_path)))
        MagicTable.card_map = load_cards()
        logging.info("%s cards loaded", len(MagicTable.card_map))

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
        player_data['deck'] = [find_card(MagicTable.card_map, c) for c in deck]
        self.data[player_data['name']] = player_data

    def save(self):
        file_path = os.path.join(MagicTable.tables_path, self.name)
        with open(file_path, mode='w') as f:
            json.dump(self.data, f)

    def get_data(self):
        return self.data


def load_cards():
    with open(os.path.join('..', 'my-app', 'public', 'my-cards.json')) as f:
        cards = json.load(f)
        logging.info(f"Cards loaded, eg {cards[0]}")
        # build map
        card_map = defaultdict(lambda: defaultdict(list))
        for card in cards:
            name = card['name']
            set_name = card['set']
            set_number = card['num']
            if "face_small" in card:
                card_map[name][set_name].append(card)
            elif "faces_small" in card:
                for face in card["faces_small"]:
                    card_map[face][set_name].append(card)
            else:
                logging.error('Failed to map %s', card)
        return card_map


class Card:
    def __init__(self, name, set_name, set_number):
        self.set_number = set_number
        self.set_name = set_name
        self.name = name


def find_card(card_map: dict, card: Card) -> dict:
    try:
        name_map = card_map[card.name]
        official_set = card.set_name and len(card.set_name) == 3
        if official_set and card.set_number and card.set_name in name_map:
            matches = [cd for cd in name_map[card.set_name] if cd['num'] == card.set_number]
            if matches:
                return matches[0]
        if official_set and card.set_name and card.set_name in name_map:
            return random.choice(name_map[card.set_name])
        # fall through if number or set not found
        random_set = random.choice(list(name_map.values()))
        return random.choice(random_set)
    except LookupError:
        logging.exception("Card data not found for %s", card.__dict__)


def parse_deck(deck_text: str) -> [Card]:
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
            cards.append(Card(name, set_name, set_number))
    return cards
