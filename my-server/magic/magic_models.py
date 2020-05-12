from dataclasses import dataclass, field
from typing import List, Optional

from dataclasses_json import DataClassJsonMixin
from py_ts_interfaces import Interface


# transport classes per https://pypi.org/project/py-ts-interfaces Interface, no mapped types e.g. Dict
# serialization support from https://lidatong.github.io/dataclasses-json/ DataClassJsonMixins

@dataclass()
class Face(Interface, DataClassJsonMixin):
    small: str
    normal: str
    name: Optional[str] = None


@dataclass()
class SFCard(Interface, DataClassJsonMixin):
    sf_id: str
    name: str
    set_name: str
    number: str
    face: Optional[Face] = None
    faces: List[Face] = field(default_factory=list)


@dataclass
class JoinRequest(Interface, DataClassJsonMixin):
    table: str
    name: str
    color: str
    deck_list: str


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
    facedown: bool = False
    transformed: bool = False
    token: bool = False


@dataclass
class Zone(Interface, DataClassJsonMixin):
    z_id: int
    owner: str
    name: str
    cards: List[int]


@dataclass
class BattlefieldCard(Interface, DataClassJsonMixin):
    bf_id: int
    card_id: int
    x: int
    y: int
    tapped: bool = False
    counters: List[Counter] = field(default_factory=list)
    last_touched: int = 0


@dataclass
class LogLine(Interface, DataClassJsonMixin):
    who: str
    when: int
    line: str


@dataclass
class Game(Interface, DataClassJsonMixin):
    players: List[Player]
    zones: List[Zone]
    cards: List[Card]
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
    game: Game
    sf_cards: List[SFCard]


def get_zone(game: Game, player: str, zone: str) -> Zone:
    return [z for z in game.zones if z.owner == player and z.name == zone][0]
