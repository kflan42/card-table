from typing import Dict, List
from magic_models import BattlefieldCard, Card, Game, LogLine, Player, Zone, TableCard


class IndexedGame:
    """Indexed version of Game and updated Log or Card information."""
    players: Dict[str, Player]
    zones: Dict[str, Zone]
    cards: Dict[int, Card]
    battlefield_cards: Dict[int, BattlefieldCard]
    log_updates: List[LogLine]
    card_updates: List[TableCard]

    def __init__(self, game: Game = None):
        if not game:
            game = Game(cards=[], players=[], zones=[], battlefield_cards=[])
        self.players = {x.name: x for x in game.players}
        self.cards = {x.card_id: x for x in game.cards}
        self.zones = {x.owner+"-"+x.name: x for x in game.zones}
        self.battlefield_cards = {x.card_id: x for x in game.battlefield_cards}
        self.log_updates = []
        self.card_updates = []

    def merge(self, other: '__class__') -> '__class__':
        """Take newer sections and add action log lines."""
        self.players.update(other.players)
        self.cards.update(other.cards)
        self.zones.update(other.zones)
        self.battlefield_cards.update(other.battlefield_cards)
        self.log_updates += other.log_updates
        self.card_updates += other.card_updates
        return self

    def to_game(self) -> Game:
        g = Game(
            cards=list(self.cards.values()), 
            players=list(self.players.values()), 
            zones=list(self.zones.values()), 
            battlefield_cards=list(self.battlefield_cards.values()), 
            )
        return g

    def __str__(self):
        return self.__dict__.__str__()
