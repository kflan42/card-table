from dataclasses import dataclass
from typing import List

from py_ts_interfaces import Interface


# transport classes, so per https://pypi.org/project/py-ts-interfaces/ no mapped types e.g. Dict

@dataclass
class Face(Interface):
    small: str
    normal: str


@dataclass
class SFCard(Interface):
    sf_id: str
    name: str
    set_name: str
    number: str
    face: Face = None
    faces: List[Face] = None


@dataclass
class JoinRequest(Interface):
    name: str
    color: str
    deck_list: str
    table: str


@dataclass
class Counter(Interface):
    name: str
    value: int


@dataclass
class Player(Interface):
    name: str
    color: str
    deck: List[int]
    counters: List[Counter]
    zones: List[int]


@dataclass
class Card(Interface):
    card_id: int
    sf_id: str
    owner: str
    facedown: bool
    transformed: bool
    token: bool


@dataclass
class Zone(Interface):
    z_id: int
    name: str
    owner: str
    cards: List[int]


@dataclass
class BattlefieldCard(Interface):
    bf_id: int
    card_id: int
    x: int
    y: int
    tapped: bool
    counters: List[Counter]
    last_touched: int


@dataclass
class LogLine(Interface):
    who: str
    when: int
    line: str


@dataclass
class Game(Interface):
    cards: List[Card]
    players: List[Player]
    zones: List[Zone]
    battlefield_cards: List[BattlefieldCard]
    action_log: List[LogLine]


HAND = "Hand"
LIBRARY = "Library"
GRAVEYARD = "Graveyard"
COMMAND_ZONE = "Command Zone"
EXILE = "Exile"
BATTLEFIELD = "Battlefield"
