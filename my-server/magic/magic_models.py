from dataclasses import dataclass
from typing import Dict, List
from uuid import UUID

from dataclass_schemas import Schema


@dataclass
class Face:
    small: str
    normal: str


FaceSchema = Schema.from_dataclass(Face)


@dataclass
class Card:
    id: UUID
    name: str
    set_name: str
    number: str
    face: Face = None
    faces: Dict[str, Face] = None


CardSchema = Schema.from_dataclass(Card)


@dataclass
class JoinRequest:
    name: str
    color: str
    deck_list: str
    table: str


JoinRequestSchema = Schema.from_dataclass(JoinRequest)


@dataclass
class Player:
    name: str
    color: str
    deck: List[int]
    counters: Dict[str, int]
    zones: Dict[str, int]


PlayerSchema = Schema.from_dataclass(Player)


@dataclass
class GameCard:
    id: int
    card_id: UUID
    owner: str
    facedown: bool
    transformed: bool
    token: bool


GameCardSchema = Schema.from_dataclass(GameCard)


@dataclass
class Zone:
    id: int
    name: str
    owner: str
    cards: List[int]


ZoneSchema = Schema.from_dataclass(Zone)


@dataclass
class BattlefieldCard:
    bf_id: int
    card_id: int
    x: int
    y: int
    tapped: bool
    counters: Dict[str, int]
    last_touched: int


BattlefieldCardSchema = Schema.from_dataclass(BattlefieldCard)


@dataclass
class LogLine:
    who: str
    when: int
    line: str


LogLineSchema = Schema.from_dataclass(LogLine)


@dataclass
class Game:
    cards: Dict[int, GameCard]
    players: Dict[str, Player]
    zones: Dict[int, Zone]
    battlefield_cards: Dict[int, BattlefieldCard]
    action_log: List[LogLine]


GameSchema = Schema.from_dataclass(Game)

HAND = "Hand"
LIBRARY = "Library"
GRAVEYARD = "Graveyard"
COMMAND_ZONE = "Command Zone"
EXILE = "Exile"
BATTLEFIELD = "Battlefield"
