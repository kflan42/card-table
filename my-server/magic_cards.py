import os
import random
import re
import time
from dataclasses import dataclass
from threading import Lock
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


@dataclass
class DeckListCard:
    name: str
    set_name: Optional[str] = None
    number: Optional[str] = None


class MagicCards:
    _cards: List[SFCard] = None
    _tokens: List[SFCard] = None
    _set_cards = None
    _card_sets = None
    _lock = Lock()

    @classmethod
    def get_all_cards(cls) -> List[SFCard]:
        if not cls._cards:
            cls._cards = load_cards()
        return cls._cards

    @classmethod
    def get_all_tokens(cls) -> List[SFCard]:
        if not cls._tokens:
            cls._tokens = load_cards("tokens")
        return cls._tokens

    @classmethod
    def initialize(cls):
        logger.info("Initializing")
        cards = cls.get_all_cards()
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
        cls._set_cards = set_cards
        cls._card_sets = {card: list(sets) for (card, sets) in card_sets.items()}  # convert to list for random picking

    @classmethod
    def find_card(cls, name, set_name=None, number=None) -> SFCard:
        # lazy init
        if not cls._set_cards:
            with cls._lock:
                cls.initialize()

        card_name = _sanitize(name)
        if card_name not in cls._card_sets:
            raise GameException(f"Card '{name}' not found.")
        if not set_name:
            _set_name = random.choice(cls._card_sets[card_name])
        else:
            _set_name = _sanitize(set_name)

        if _set_name not in cls._set_cards:
            raise GameException(f"Set '{set_name}' not found for Card '{name}'; "
                                f"found {', '.join((s.upper() for s in cls._card_sets[card_name]))}.")

        cards_by_name = cls._set_cards[_set_name]
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

    @classmethod
    def resolve_cards(cls, deck: List[DeckListCard]) -> Tuple[List[SFCard], List[Exception]]:
        sf_cards = []
        errors = []
        for c in deck[:1000]:  # limit deck to 1000 cards
            try:
                sf_cards.append(cls.find_card(c.name, c.set_name, c.number))
            except Exception as e:
                errors.append(e)
        return sf_cards, errors

    @classmethod
    def resolve_decklist(cls, deck_text: str):
        deck_cards, sideboard_cards = parse_deck(deck_text)
        deck, errors = cls.resolve_cards(deck_cards)
        sideboard, side_errors = cls.resolve_cards(sideboard_cards)
        if errors + side_errors:
            raise GameException("Deck Error(s):\n\t" + "\n\t".join(str(e) for e in errors + side_errors))
        return deck, sideboard


def parse_deck(deck_text: str) -> Tuple[List[DeckListCard], List[DeckListCard]]:
    """Returns name,set,number tuples with the commander first if there is one."""
    deck, sideboard = [], []
    lines = deck_text.strip().splitlines()
    lines = lines[:250]  # limit to 250 different cards in the deck
    # put CMDR first if present
    def cmdr_line(line): return "*CMDR*" in line or "[Commander" in line
    lines = [_ for _ in lines if cmdr_line(_)] + [_ for _ in lines if not cmdr_line(_)]
    errors = []
    in_sideboard = False
    for line in lines:
        if len(line.strip()) == 0 \
                or line.lower().startswith("sideboard")\
                or line.lower().startswith("maybeboard"):
            # blank line separates deck from sideboard or maybeboard
            in_sideboard = True
            continue  # no card to parse in this line
        if in_sideboard and " " not in line:
            continue  # skip sideboard category names
        try:
            count, card, sideboard_card = parse_line(line)
            for _ in range(count):
                if sideboard_card or in_sideboard:
                    sideboard.append(card)
                else:
                    deck.append(card)
        except Exception as e:
            errors.append((line, e))
    if errors:
        raise GameException(f"Error(s) parsing cards: "+" ".join(f"{line} > {e}" for (line, e) in errors))
    return deck, sideboard


basic_pattern = re.compile(r"^(\d+)[xX]? ((?: ?[\w',\-]+| //)+)")
xmage_p = re.compile(r"(?P<SB>SB: )?(\d+) \[(\w+):(\w+)] ((?: ?[\w',\-]+)+)")
tcg_p = re.compile(r"\((\d+)\)(?: -[\w ]+)?(?: ?\[(\w+)])?")
set_bracket_p = re.compile(r"\[(\w+)]")
set_num_p = re.compile(r"\((\w+)\)(?: ?(\d+))?")
categories_p = re.compile(r"(?P<F>\*F\* +)?\[[\w\- ]+(?P<noDeck>{noDeck})?(?P<noPrice>{noPrice})?]")


def parse_line(line: str) -> Tuple[int, Optional[DeckListCard], bool]:

    # .dek file from "Decked" app
    if line.startswith('//'):  # ///mvid:##### unique to the app
        return 0, None, False
    sideboard_prefix = line.startswith('SB:')
    if sideboard_prefix:
        line = line[3:].lstrip()

    # check XMage first since it's weird
    m_x = re.match(xmage_p, line)
    if m_x:
        count = int(m_x[2])
        set_name = m_x[3]  # XMage [set:
        set_number = m_x[4]  # Xmage :num]
        name = m_x[5]
        return count, DeckListCard(name, set_name, set_number), bool(m_x['SB'])

    # now try the rest
    m = re.match(basic_pattern, line)
    if m:
        count = int(m[1])
        name = m[2]
        suffix = line.replace(m[0], "").strip()
        # try various suffix formats in an order that avoids ambiguity
        set_name, set_number = parse_suffix_tcg(suffix)
        if set_name:
            return count, DeckListCard(name, set_name, set_number), False
        set_name, set_number, sideboard_suffix = parse_suffix_paren_set(suffix)
        return count, DeckListCard(name, set_name, set_number), \
            sideboard_prefix or sideboard_suffix

    # Give up
    raise GameException(f'Unable to parse line in deck list: "{line}".')


def parse_suffix_tcg(suffix):
    """TCGPlayer: (num) - blah blah [set] | [set]"""
    set_name = None
    set_number = None
    m = re.match(tcg_p, suffix)
    if m:
        set_number = int(m[1])
        set_name = m[2]
    m = re.match(set_bracket_p, suffix)
    if m:
        set_name = m[1]
    return set_name, set_number


def parse_suffix_paren_set(suffix):
    """TappedOut: (set) num | Archidekt: (set) num *F* [label label{noDeck}{noPrice}]"""
    set_name = None
    set_number = None
    sideboard = False
    m = re.match(set_num_p, suffix)
    if m:
        set_name = m[1]
        if len(m.groups()) > 2:
            set_number = m[2]
        categories = suffix.replace(m[0], "").strip()
        m = re.match(categories_p, categories)
        if m and m['noDeck']:
           sideboard = True
    return set_name, set_number, sideboard

