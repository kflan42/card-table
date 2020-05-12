import json
import logging
import os
import random
import re
import time
from collections import defaultdict
from typing import List, Tuple, Optional

from magic_models import SFCard, JoinRequest, Player, Card, Zone, ZONES, Game, LIBRARY, Table, Counter, Face, EXILE, \
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
            self.table = Table(name=name, sf_cards=[],
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

        # start with cards in library, last in command zone, extras in sideboard
        c_ids = [c.card_id for c in cards]
        [z for z in zones if z.name == LIBRARY][0].cards.extend(c_ids[:99])
        [z for z in zones if z.name == COMMAND_ZONE][0].cards.append(c_ids[99])
        if len(c_ids) > 100:
            [z for z in zones if z.name == EXILE][0].cards.extend(c_ids[100:])
        z_ids = [z.z_id for z in zones]

        # setup player
        player = Player(name=join_request.name, color=join_request.color, counters=[], zones=z_ids)
        player.counters.append(Counter(name="Life", value=40))
        table.game.players.append(player)
        return True

    def save(self):
        file_path = os.path.join(MagicTable.get_tables_path(), self.table.name + ".json")
        with open(file_path, mode='w') as f:
            f.write(self.table.to_json())

    def get_cards(self):
        return SFCard.schema().dumps(self.table.sf_cards + MagicTable.get_all_tokens(), many=True)


def load_cards(what="cards") -> List[SFCard]:
    with open(os.path.join('data', 'cards', f'{what}.json')) as f:
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
                elif k == "face" and d[k]:
                    d[k] = Face(**d[k])
                elif k == "faces" and d[k]:
                    d[k] = [Face(**fa) for fa in d[k]]
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
                    self.card_map[face.name][card.set_name].append(card)
            else:
                logging.error('Failed to map %s', card)

    def find_card(self, name, set_name=None, number=None) -> SFCard:
        try:
            name = name.replace(" / ", " // ")  # some deck formats use single slash instead of double
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
        if len(card_parts) < 2:  # shortest is count "name"
            continue  # blanks separate sideboard sometimes
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
