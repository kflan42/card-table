import json
import logging
import os
import random
import re
import time
from collections import defaultdict
from typing import List, Tuple, Optional

from magic.magic_models import SFCard, Face


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
            msg = f"Card not found for {{name: {name}, set:{set_name}, number:{number}}}"
            logging.exception(msg)
            ex = Exception(msg)
            raise ex


def parse_deck(deck_text: str) -> List[Tuple[str, Optional[str], Optional[str]]]:
    cards = []
    for line in deck_text.strip().splitlines():
        try:
            count, card = parse_line(line)
            for _ in range(count):
                cards.append(card)
        except Exception as e:
            raise Exception(f"Error parsing card {line}", e)
    return cards


def parse_line(line: str) -> Tuple[int, Optional[Tuple[str, Optional[str], Optional[str]]]]:
    """
    NOTE name doesn't have '[', ' - ', or '(' except un-sets or Japanese full art lands
    """
    card_parts = line.strip().split(" ")
    if len(card_parts) < 2:
        return 0, None  # blanks separate sideboard sometimes
    if card_parts[0] == "SB:":
        card_parts.pop(0)  # XMage sideboard thing

    # minimum listing is count "name"
    m = re.match(r'[rx]?(\d+)[rx]?', card_parts[0])
    if m:
        count = int(m[1])
    else:
        return 0, None

    # ALL count "name ... name"
    # TappedOut (set) num | TCGPlayer (num) [set] | XMage [set:num]
    set_name = None  # scryfall set names are lowercase
    set_number = None
    set_name_or_number = None
    name_words = []
    ignoring = False
    for i, word in enumerate(card_parts[1:]):
        m_p = re.match(r'\((\w+)\)', word)
        m_b = re.match(r'\[(\w+)\]', word)
        m_x = re.match(r'\[(\w+):(\w+)\]', word)
        if m_p:
            if set_name_or_number is None:
                set_name_or_number = m_p[1].lower()  # TappedOut (set) or TCGPlayer (num)
        elif m_b:
            set_name = m_b[1].lower()  # TCGPlayer [set]
            if set_name_or_number:
                set_number = set_name_or_number
        elif m_x:
            set_name = m_x[1].lower()  # XMage [set:
            set_number = m_x[2].lower()  # Xmage :num]
        elif word == "-":
            ignoring = True  # TCGPlayer can have " - Full Art" before [set] for special prints
        elif word[0] == "(":
            ignoring = True
        elif word[-1] == ")":
            ignoring = False
        elif not ignoring:
            if set_name_or_number:  # TappedOut num
                set_name = set_name_or_number
                set_number = word  # TappedOut
                set_name_or_number = None
            elif word == "/":
                name_words.append("//")  # some deck formats use single slash instead of double like scryfall
            else:
                name_words.append(word)

    if set_name_or_number and not set_name:
        set_name = set_name_or_number  # TappedOut without num

    name = " ".join(name_words)
    return count, (name, set_name, set_number)

