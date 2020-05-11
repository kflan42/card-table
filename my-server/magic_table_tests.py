import logging
import sys
import unittest

from magic_models import JoinRequest
from magic_table import MagicTable, parse_deck, CardResolver
from test_table import arena_deck, txt_deck, test_table

logging.basicConfig(format='%(asctime)s %(message)s', stream=sys.stdout, level=logging.DEBUG)


class MyTestCase(unittest.TestCase):

    def test_deck_parsing(self):
        deck0 = parse_deck(arena_deck)
        deck1 = parse_deck(txt_deck)
        print(deck0)
        print(deck1)
        self.assertEqual(len(deck0), len(deck1))

    def test_load_tokens(self):
        print(MagicTable.get_all_cards()[-1])

    def test_load_cards(self):
        print(MagicTable.get_all_cards()[0])

    def test_card_map(self):
        resolver = CardResolver(MagicTable.get_all_cards())
        print(resolver.find_card('Akroma, Angel of Wrath'))
        print(resolver.find_card('Nissa, Vastwood Seer'))
        # self.assertIn('face_small', card_map['Akroma, Angel of Wrath']['c20'][0])
        # self.assertIn('faces_small', card_map['Nissa, Vastwood Seer']['v17'][0])

    def test_add_player(self):
        player = JoinRequest(name='kerran', table='1', deck_list=arena_deck, color='OliveDrab')
        table = MagicTable(player.table)
        table.add_player(player)
        print(table.table.to_json())

    def test_test_table(self):
        print(test_table().table.to_json())


if __name__ == '__main__':
    unittest.main()
