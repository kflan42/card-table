import os
import random
import time

from magic_cards import MagicCards
from magic_table import MagicTable, Game, Zone
from magic_models import JoinRequest, CardMove, PlayerAction, CounterChange, CardChange, \
    CreateToken
from magic_constants import ZONES, LIBRARY, HAND, BATTLEFIELD, TOGGLE_TAP_CARD, TOGGLE_TRANSFORM_CARD, \
    TOGGLE_FACEDOWN_CARD


def test_deck(deck_name: str) -> str:
    text_file = open('test_decks'+os.sep+deck_name, 'r')
    d = text_file.read()
    text_file.close()
    return d


def get_zone(game: Game, player: str, zone: str) -> Zone:
    return [z for z in game.zones if z.owner == player and z.name == zone][0]


def test_table(name: str) -> MagicTable:
    table = MagicTable(name)
    # add players
    for player, deck, color in [
        ('Arena 1', test_deck('arena_deck'), 'Green'),
        ('Text 2', test_deck('txt_deck'), 'Red'),
        ('Side 3', test_deck('deck_w_side'), 'Blue'),
        ('T Out 4', test_deck('tapped_out'), 'White'),
        ('Std 5', test_deck('pioneer_60'), 'Black'),
    ]:
        d, s = MagicCards.resolve_decklist(deck)
        table.add_player(JoinRequest(name=player, table='test', deck=d, sideboard=s, color=color))

    # make it busy
    game = table.table.game
    for player in game.players:
        zs = {z: get_zone(game, player.name, z) for z in ZONES}

        pa = PlayerAction(kind='Draw', who=player.name, when=round(time.time() * 1000),
                          card_moves=[],
                          card_changes=[],
                          counter_changes=[],
                          create_tokens=[]
                          )
        d = PlayerAction.from_dict(pa.to_dict())
        d.kind = 'Draw'
        d.when = round(time.time() * 1000)
        d.card_moves = [CardMove(card_id=c, src_zone=LIBRARY, src_owner=player.name,
                                 tgt_zone=HAND, tgt_owner=player.name) for c in zs[LIBRARY].cards[:7]]
        table.resolve_action(d)

        cc = PlayerAction.from_dict(pa.to_dict())
        cc.when = round(time.time() * 1000)
        cc.counter_changes = [CounterChange(name="C. Casts", value=2, player=player.name)]
        table.resolve_action(cc)

        cm = PlayerAction.from_dict(pa.to_dict())
        cm.when = round(time.time() * 1000)
        cm.card_moves = [CardMove(card_id=c, src_zone=LIBRARY, src_owner=player.name,
                                  tgt_zone=BATTLEFIELD, tgt_owner=player.name) for c in zs[LIBRARY].cards[:7]]
        cm.card_changes = [CardChange(card_id=c, change="", to_x=c % 75, to_y=c % 60) for c in zs[LIBRARY].cards[:7]]
        table.resolve_action(cm)

        ce = PlayerAction.from_dict(pa.to_dict())
        ce.when = round(time.time() * 1000)
        ce.card_changes = [
            CardChange(card_id=zs[BATTLEFIELD].cards[0], change=TOGGLE_TAP_CARD),
            CardChange(card_id=zs[BATTLEFIELD].cards[1], change=TOGGLE_TRANSFORM_CARD),
            CardChange(card_id=zs[BATTLEFIELD].cards[2], change=TOGGLE_FACEDOWN_CARD),
        ]
        ce.counter_changes = [
            CounterChange(name="+1/+1", value=1, card_id=zs[BATTLEFIELD].cards[3])
        ]
        ce.create_tokens = [
            CreateToken(owner=player.name, sf_id=random.choice(MagicCards.get_all_tokens()).sf_id)
        ]
        table.resolve_action(ce)

    return table
