import logging
import sys
import time
import unittest

from magic_models import JoinRequest
from magic_table import MagicTable
from magic_cards import MagicCards, parse_deck, parse_line
from test_table import arena_deck, txt_deck, test_table, xmage_deck, tcgplayer_deck, archi_deck, archi_txt, deck_w_side, \
    pioneer_60, tapped_out

logging.basicConfig(format='%(asctime)s %(message)s', stream=sys.stdout, level=logging.DEBUG)


class MyTestCase(unittest.TestCase):

    def test_archi_card_parsing(self):
        c, card, sb = parse_line("1x Nissa, Vastwood Seer // Nissa, Sage Animist (ori) [Pricey{noDeck}{noPrice}]")
        self.assertEqual(c, 1)
        self.assertEqual(card.name, "Nissa, Vastwood Seer // Nissa, Sage Animist")
        self.assertEqual(card.set_name, "ori")
        self.assertEqual(sb, True)

    def test_deck_parsing(self):
        deck0, side0 = parse_deck(arena_deck)
        deck1, side1 = parse_deck(txt_deck)
        deck2, side2 = parse_deck(xmage_deck)
        deck3, side3 = parse_deck(tcgplayer_deck)
        deck4, side4 = parse_deck(deck_w_side)
        deck5, side5 = parse_deck(pioneer_60)
        deck6, side6 = parse_deck(tapped_out)
        arch_deck1, arch_side1 = parse_deck(archi_deck)
        arch_deck2, arch_side2 = parse_deck(archi_txt)
        self.assertEqual(100, len(deck0))
        self.assertEqual(100, len(deck1))
        self.assertEqual(100, len(deck2 + side2))  # xmage cmdr lands in sideboard
        self.assertEqual(100, len(deck3))
        self.assertEqual(100, len(deck4))
        self.assertEqual(60, len(deck5))
        self.assertEqual(14, len(side5))
        self.assertEqual(100, len(deck6))
        self.assertEqual(100, len(arch_deck1))
        self.assertEqual(100, len(arch_deck2))
        self.assertEqual(arch_deck1[0].name, arch_deck2[0].name)


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
        arena_deck_cards, side = MagicCards.resolve_decklist(arena_deck)
        player = JoinRequest(name='kerran', table='test1', deck=arena_deck_cards, sideboard=side, color='OliveDrab')
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
