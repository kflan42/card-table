import json
import logging
import os
import random
import re
import time
from collections import defaultdict
from typing import List, Tuple, Optional

from magic_models import SFCard, Face


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
                self.card_map[" // ".join([f.name for f in card.faces])][card.set_name].append(card)
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
        except Exception as e:
            logging.exception(f"Card data not found for {name} {set_name} {number}", e)


def parse_deck(deck_text: str) -> List[Tuple[str, Optional[str], Optional[str]]]:
    cards = []
    for line in deck_text.strip().splitlines():
        try:
            xm = re.match(r'(SB: )?\d+ \[(\w+):(\w+)] .*', line)
            if xm:
                count, card = parse_xmage_line(line)
            else:
                count, card = parse_line(line)
            for _ in range(count):
                cards.append(card)
        except Exception as e:
            raise Exception(f"Error parsing card {line}", e)
    return cards


def parse_line(line: str) -> Tuple[int, Optional[Tuple[str, Optional[str], Optional[str]]]]:
    card_parts = line.strip().split(" ")
    if len(card_parts) < 2:  # shortest is count "name"
        return 0, None  # blanks separate sideboard sometimes
    m = re.match(r'[rx]?(\d+)[rx]?', card_parts[0])
    if m:
        count = int(m[1])
    else:
        return 0, None
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
    return count, (name, set_name, set_number)


def parse_xmage_line(line: str) -> Tuple[int, Optional[Tuple[str, Optional[str], Optional[str]]]]:
    """
    e.g.
    1 [ISD:71] Rooftop Storm
    SB: 1 [ARB:113] Thraximundar
    """
    card_parts = line.strip().split(" ")
    if card_parts[0] == "SB:":
        card_parts.pop(0)
    count = int(card_parts[0])
    m = re.match(r'\[(\w+):(\w+)]', card_parts[1])
    if m:
        set_name = m[1].lower()
        set_number = m[2].lower()  # not always numeric
        name = " ".join(card_parts[2:])
        return count, (name, set_name, set_number)
    else:
        return 0, None
