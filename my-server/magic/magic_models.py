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
LOOK = "Look"  # Used for scry, look at top N, reveal, etc.
GRAVEYARD = "Graveyard"
COMMAND_ZONE = "Command Zone"
EXILE = "Exile"
BATTLEFIELD = "Battlefield"
ZONES = [HAND, LIBRARY, LOOK, GRAVEYARD, COMMAND_ZONE, EXILE, BATTLEFIELD]


@dataclass
class CardMove(Interface, DataClassJsonMixin):
    card_id: int
    src_zone: str
    src_owner: str
    tgt_zone: str
    tgt_owner: str
    bf_id: Optional[int] = None
    to_x: Optional[int] = None
    to_y: Optional[int] = None
    to_idx: Optional[int] = None


@dataclass
class CardChange(Interface, DataClassJsonMixin):
    """Tap, Transform, Flip"""
    card_id: int


@dataclass
class CounterChange(Interface, DataClassJsonMixin):
    """Either bf_id or player."""
    label: str
    value: int
    bf_id: Optional[int] = None
    player: Optional[str] = None


@dataclass
class CreateToken(Interface, DataClassJsonMixin):
    """Almost idempotent: limit to 1 per time unit per player. 
    Never deleted but sometimes moved to not be in any zone."""
    owner: str
    copy_card_id: int
    sf_id: str


@dataclass
class PlayerAction(Interface, DataClassJsonMixin):
    """Should be idempotent."""
    table: str
    kind: str
    who: str
    when: int
    card_moves: List[CardMove]
    card_changes: List[CardChange]
    counter_changes: List[CounterChange]
    create_tokens: List[CreateToken]
    message: Optional[str] = None


@dataclass
class Table(Interface, DataClassJsonMixin):
    name: str
    game: Game
    sf_cards: List[SFCard]
    actions: List[PlayerAction]


def get_zone(game: Game, player: str, zone: str) -> Zone:
    return [z for z in game.zones if z.owner == player and z.name == zone][0]
