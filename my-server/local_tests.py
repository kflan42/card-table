from magic_models import JoinRequest
import json
from magic_cards import parse_deck
import unittest
from typing import List

class ResearchTest(unittest.TestCase):

    def test_parse_real_decks(self):
        with open("data\logs\DeckLists_20200708.json") as f:
            join_requests: List[JoinRequest] = json.load(f)
            for j in join_requests:
                j = JoinRequest(**j)
                d = parse_deck(j.deck_list)
                tapped_out_dl = "\n".join([f'{c[0]}' for c in d])
                print("{} in {}\n{}\n====".format(j.name, j.table, tapped_out_dl))
        print("done")