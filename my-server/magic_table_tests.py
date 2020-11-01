import logging
import sys
import time
import unittest

from magic_models import JoinRequest
from magic_table import MagicTable
from magic_cards import MagicCards, parse_deck
from test_table import arena_deck, txt_deck, test_table, xmage_deck, tcgplayer_deck

logging.basicConfig(format='%(asctime)s %(message)s', stream=sys.stdout, level=logging.DEBUG)


class MyTestCase(unittest.TestCase):

    def test_deck_parsing(self):
        deck0 = parse_deck(arena_deck)
        deck1 = parse_deck(txt_deck)
        deck2 = parse_deck(xmage_deck)
        deck3 = parse_deck(tcgplayer_deck)
        print(deck0)
        print(deck1)
        print(deck2)
        print(deck3)
        self.assertEqual(len(deck0), len(deck1))
        self.assertEqual(len(deck0), len(deck2))
        self.assertEqual(len(deck0), len(deck3))

    def test_load_tokens(self):
        print(MagicCards.get_all_tokens()[-1])

    def test_load_cards(self):
        print(MagicCards.get_all_cards()[-1])

    def test_card_map(self):
        akroma = MagicCards.find_card('Akroma, Angel of Wrath', 'c20')
        print(akroma)
        nissa = MagicCards.find_card('Nissa, Vastwood Seer', 'v17')
        print(nissa)
        self.assertNotEqual(akroma.face.small, akroma.face.normal)
        self.assertEqual(nissa.faces[1].name, "Nissa, Sage Animist")
        murderous_rider = MagicCards.find_card('Murderous Rider')
        print(murderous_rider)
        self.assertEqual(murderous_rider.faces[1].name, "Swift End")
        lim_duls_vault = MagicCards.find_card("Lim-Dul's Vault")
        print(lim_duls_vault)
        lim_duls_vault = MagicCards.find_card("Lim-Dûl's Vault")
        print(lim_duls_vault)

    def test_add_player(self):
        arena_deck_cards = MagicCards.resolve_deck(arena_deck)
        player = JoinRequest(name='kerran', table='test1', deck=arena_deck_cards, color='OliveDrab')
        table = MagicTable(player.table)
        table.add_player(player)
        print(table.table.to_json())

    def test_test_table(self):
        table = test_table("test2")
        print(table.table.to_json())

    def test_save_load(self):
        table = test_table("test3")
        t0 = time.time()
        table.save()
        t1 = time.time()
        logging.info(f"table saved in {t1 - t0:.3f}s")
        t0 = time.time()
        table3 = MagicTable.load("test3")
        t1 = time.time()
        logging.info(f"table loaded in {t1 - t0:.3f}s")
        print(table3.indexed_game.players.keys())


if __name__ == '__main__':
    unittest.main()
