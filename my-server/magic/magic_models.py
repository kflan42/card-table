from dataclasses import dataclass
from typing import List

from dataclasses_json import DataClassJsonMixin
from py_ts_interfaces import Interface


# transport classes, so per https://pypi.org/project/py-ts-Interface, DataClassJsonMixins/ no mapped types e.g. Dict


@dataclass
class Face(Interface, DataClassJsonMixin):
    small: str
    normal: str


@dataclass
class SFCard(Interface, DataClassJsonMixin):
    sf_id: str
    name: str
    set_name: str
    number: str
    face: Face = None
    faces: List[Face] = None


@dataclass
class JoinRequest(Interface, DataClassJsonMixin):
    name: str
    color: str
    deck_list: str
    table: str


@dataclass
class Counter(Interface, DataClassJsonMixin):
    name: str
    value: int


@dataclass
class Player(Interface, DataClassJsonMixin):
    name: str
    color: str
    zones: List[int]
    counters: List[Counter]


@dataclass
class Card(Interface, DataClassJsonMixin):
    card_id: int
    sf_id: str
    owner: str
    facedown = False
    transformed = False
    token = False


@dataclass
class Zone(Interface, DataClassJsonMixin):
    z_id: int
    name: str
    owner: str
    cards: List[int]


@dataclass
class BattlefieldCard(Interface, DataClassJsonMixin):
    bf_id: int
    card_id: int
    x: int
    y: int
    counters: List[Counter]
    last_touched = 0
    tapped = False


@dataclass
class LogLine(Interface, DataClassJsonMixin):
    who: str
    when: int
    line: str


@dataclass
class Game(Interface, DataClassJsonMixin):
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
ZONES = [HAND, LIBRARY, GRAVEYARD, COMMAND_ZONE, EXILE, BATTLEFIELD]


@dataclass
class Table(Interface, DataClassJsonMixin):
    name: str
    sf_cards: List[SFCard]
    game: Game


def get_zone(game: Game, player: str, zone: str) -> Zone:
    return [z for z in game.zones if z.owner == player and z.name == zone][0]
