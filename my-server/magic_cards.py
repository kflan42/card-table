import os
import random
import re
import time
from typing import List, Tuple, Optional, Dict, Set

import persistence
from magic_constants import GameException
from magic_models import SFCard, Face
import unicodedata

from utils import logger


def load_cards(what="cards", file_path=None) -> List[SFCard]:
    if what and not file_path:
        file_path = os.path.join('cards', f'{what}.json')
    elif not file_path:
        raise Exception("Must specify what or path to load!")
    t0 = time.time()
    # card_list = persistence.load(file_path, encoding='UTF-8', decoder=lambda d: SFCard.schema().loads(d, many=True))
    # too slow ^
    # this is about 20x faster, bypassing Schema logic
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

    data = persistence.load(file_path, encoding='UTF-8')
    card_list = [load_card(c) for c in data]
    t1 = time.time()
    logger.info(f"{len(card_list)} {what} loaded in {t1 - t0:.3f}s, eg {card_list[0]}")
    return card_list


def _sanitize(word: str) -> str:
    """Lim-Dûl's Vault --> Lim-Dul's Vault --> lim-dul's vault"""
    return unicodedata.normalize('NFD', word).encode('ascii', 'ignore').decode().lower()


class CardResolver:

    def __init__(self, cards: List[SFCard]):
        # build map:
        set_cards: Dict[str, Dict[str, List[SFCard]]] = {}  # set -> card name -> list of card
        card_sets: Dict[str, Set[str]] = {}  # card name -> list of sets it is in
        for card in cards:
            set_map = set_cards.setdefault(card.set_name, {})
            names = []
            if card.face:
                names.append(_sanitize(card.name))
            if card.faces:
                for face in card.faces:
                    names.append(_sanitize(face.name))
                compound = " // ".join([_sanitize(f.name) for f in card.faces])
                names.append(compound)
            for name in names:
                card_list = set_map.setdefault(name, [])
                card_list.append(card)
                card_sets.setdefault(name, set()).add(card.set_name)
            if not card.face and not card.faces:
                logger.error('Failed to map %s', card)
        self.set_cards = set_cards
        self.card_sets = {card: list(sets) for (card, sets) in card_sets.items()}  # convert to list for random picking

    def find_card(self, name, set_name=None, number=None) -> SFCard:
        card_name = _sanitize(name)
        if card_name not in self.card_sets:
            raise GameException(f"Card '{name}' not found.")
        if not set_name:
            _set_name = random.choice(self.card_sets[card_name])
        else:
            _set_name = _sanitize(set_name)

        if _set_name not in self.set_cards:
            raise GameException(f"Set '{set_name}' not found for Card '{name}'.")

        cards_by_name = self.set_cards[_set_name]
        if card_name not in cards_by_name:
            raise GameException(f"Card '{name}' not found in set '{set_name}'.")
        card_list = cards_by_name[card_name]

        if number:
            card = next((cd for cd in card_list if cd.number == number), None)
            if not card:
                raise GameException(f"Card '{name}' number {number} not found in set '{set_name}'")
            return card
        else:
            return random.choice(card_list)


def parse_deck(deck_text: str) -> List[Tuple[str, Optional[str], Optional[str]]]:
    """Returns name,set,number tuples with the commander first if there is one."""
    cards = []
    lines = deck_text.strip().splitlines()
    lines = lines[:250]  # limit to 250 different cards in the deck
    # put CMDR first if present
    lines = [_ for _ in lines if "*CMDR*" in _] + [_ for _ in lines if "*CMDR*" not in _]
    errors = []
    for line in lines:
        try:
            count, card = parse_line(line)
            for _ in range(count):
                cards.append(card)
        except Exception as e:
            errors.append((line, e))
    if errors:
        raise GameException(f"Error(s) parsing cards: "+", ".join(f"{line} > {e}" for (line, e) in errors))
    return cards


def parse_line(line: str) -> Tuple[int, Optional[Tuple[str, Optional[str], Optional[str]]]]:
    """
    NOTE name doesn't have '*', '[', ' - ', or '(' except un-sets or Japanese full art lands
    """
    card_parts = line.strip().split(" ")
    if len(card_parts) < 2:
        return 0, None  # blanks separate sideboard sometimes
    if card_parts[0] == "SB:":
        card_parts.pop(0)  # XMage sideboard thing
    if card_parts[0].startswith('///'):
        return 0, None  # .dec file and non-scryfall id on this line

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
    for _, word in enumerate(card_parts[1:]):
        m_p = re.match(r'\((\w+)\)', word)
        m_b = re.match(r'\[(\w+)]', word)
        m_x = re.match(r'\[(\w+):(\w+)]', word)
        if m_p:
            if set_name_or_number is None:
                set_name_or_number = m_p[1]  # TappedOut (set) or TCGPlayer (num)
        elif m_b:
            set_name = m_b[1]  # TCGPlayer [set]
            if set_name_or_number:
                set_number = set_name_or_number
        elif m_x:
            set_name = m_x[1]  # XMage [set:
            set_number = m_x[2]  # Xmage :num]
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
            elif word[0] != '*':
                name_words.append(word)

    if set_name_or_number and not set_name:
        set_name = set_name_or_number  # TappedOut without num

    name = " ".join(name_words)
    return count, (name, set_name, set_number)

