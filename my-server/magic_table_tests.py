import logging
import sys
import unittest

from magic_models import JoinRequest
from magic_table import MagicTable
from magic_cards import CardResolver, parse_deck
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
        print(MagicTable.get_all_cards()[-1])

    def test_load_cards(self):
        print(MagicTable.get_all_cards()[0])

    def test_card_map(self):
        resolver = CardResolver(MagicTable.get_all_cards())
        akroma = resolver.find_card('Akroma, Angel of Wrath', 'c20')
        print(akroma)
        nissa = resolver.find_card('Nissa, Vastwood Seer', 'v17')
        print(nissa)
        self.assertNotEqual(akroma.face.small, akroma.face.normal)
        self.assertEqual(nissa.faces[1].name, "Nissa, Sage Animist")

    def test_add_player(self):
        player = JoinRequest(name='kerran', table='1', deck_list=arena_deck, color='OliveDrab')
        table = MagicTable(player.table)
        table.add_player(player)
        print(table.table.to_json())

    def test_test_table(self):
        print(test_table().table.to_json())


if __name__ == '__main__':
    unittest.main()
