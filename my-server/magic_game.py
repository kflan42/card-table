from typing import Dict, List
from magic_models import BattlefieldCard, Card, Game, LogLine, Player, Zone

class IndexedGame:
    players: Dict[str, Player]
    zones: Dict[str, Zone]
    cards: Dict[int, Card]
    battlefield_cards: Dict[int, BattlefieldCard]
    action_log: List[LogLine]

    def __init__(self, game:Game):
        self.players = {x.name: x for x in game.players}
        self.cards = {x.card_id: x for x in game.cards}
        self.zones = {x.owner+"-"+x.name: x for x in game.zones}
        self.battlefield_cards = {x.card_id: x for x in game.battlefield_cards}
        self.action_log = game.action_log

    def merge(self, other:'__class__') -> '__class__':
        """Take newer sections and add action log lines."""
        self.players.update(other.players)
        self.cards.update(other.cards)
        self.zones.update(other.zones)
        self.battlefield_cards.update(other.battlefield_cards)
        self.action_log += other.action_log
        return self

    def to_game(self) -> Game:
        g = Game(
            cards=list(self.cards.values()), 
            players=list(self.players.values()), 
            zones=list(self.zones.values()), 
            battlefield_cards=list(self.battlefield_cards.values()), 
            action_log=self.action_log
            )
        return g

    def __str__(self):
            return self.__dict__.__str__()
