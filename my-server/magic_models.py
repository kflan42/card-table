from dataclasses import dataclass, field
from typing import List, Optional

from dataclasses_json import DataClassJsonMixin
from py_ts_interfaces import Interface


# transport classes per https://pypi.org/project/py-ts-interfaces Interface, no mapped types e.g. Dict
# serialization support from https://lidatong.github.io/dataclasses-json/ DataClassJsonMixins

@dataclass()
class Face(Interface, DataClassJsonMixin):
    normal: Optional[str] = None
    small: Optional[str] = None
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
    """Represents a card (or token) in the game."""
    card_id: int
    facedown: bool = False
    transformed: bool = False


@dataclass()
class TableCard(Interface, DataClassJsonMixin):
    """Represents a card at the table."""
    card_id: int
    sf_id: str
    owner: str
    token: bool = False


@dataclass
class Zone(Interface, DataClassJsonMixin):
    """Zones are where cards exist."""
    z_id: int
    owner: str
    name: str
    cards: List[int]


@dataclass
class BattlefieldCard(Interface, DataClassJsonMixin):
    """Represents a card on the battlefield."""
    card_id: int
    x: int
    y: int
    tapped: bool = False
    flipped: bool = False
    counters: List[Counter] = field(default_factory=list)
    last_touched: int = 0


@dataclass
class LogLine(Interface, DataClassJsonMixin):
    """How players can see what has happened."""
    who: str
    when: int
    line: str


@dataclass
class Game(Interface, DataClassJsonMixin):
    players: List[Player]
    zones: List[Zone]
    cards: List[Card]
    battlefield_cards: List[BattlefieldCard]


@dataclass
class CardMove(Interface, DataClassJsonMixin):
    """Between zones or re-ordering inside a zone."""
    card_id: int
    src_zone: str
    src_owner: str
    tgt_zone: str
    tgt_owner: str
    to_idx: Optional[int] = None


@dataclass
class CardChange(Interface, DataClassJsonMixin):
    """Tap, Transform, Flip"""
    card_id: int
    change: str
    to_x: Optional[int] = None
    to_y: Optional[int] = None


@dataclass
class CounterChange(Interface, DataClassJsonMixin):
    """Either card_id or player."""
    name: str
    value: int
    card_id: Optional[int] = None
    player: Optional[str] = None


@dataclass
class CreateToken(Interface, DataClassJsonMixin):
    """Almost idempotent: limit to 1 per time unit per player. 
    Never deleted but sometimes moved to not be in any zone."""
    owner: str
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
    table_cards: List[TableCard]
    actions: List[PlayerAction]
    log_lines: List[LogLine]


@dataclass
class SaveGame(Interface, DataClassJsonMixin):
    """Just what we have to save a lot."""
    game: Game
    actions: List[PlayerAction]
    log_lines: List[LogLine]