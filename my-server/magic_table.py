import os
import time
from random import shuffle, seed, choice, randint
from typing import Tuple

import persistence
from magic_cards import load_cards, MagicCards
from magic_constants import *
from magic_game import IndexedGame
from magic_models import *
from utils import logger

SAVE_GAME_JSON = '.save_game.json'


def is_test(table_name: str) -> bool:
    table_name = table_name.lower()
    return "test" in table_name and table_name[:4] == "test"


class MagicTable:
    _tables_path: str = os.path.join('tables')

    @staticmethod
    def get_tables_path():
        return MagicTable._tables_path

    @staticmethod
    def list_table_files():
        table_files = persistence.ls_dir(MagicTable.get_tables_path()+os.path.sep)
        tables = []
        for (table_file, m_time) in table_files:
            if table_file.endswith(SAVE_GAME_JSON):
                table_name = table_file.replace(SAVE_GAME_JSON, '')
                tables.append((table_name, m_time))
        return tables

    @staticmethod
    def load(table_name):
        file_path = os.path.join(MagicTable.get_tables_path(), table_name)
        sg = persistence.load(file_path + ".save_game.json",
                              decoder=lambda d: SaveGame.schema().loads(d))
        if not sg:
            return None
        # load the rest, stored in pieces
        sf_cards = load_cards(file_path=file_path + ".sf_cards.json")  # optimized for speed
        table_cards = persistence.load(file_path + ".table_cards.json",
                                       decoder=lambda d: TableCard.schema().loads(d, many=True))

        table = Table(name=table_name, sf_cards=sf_cards, table_cards=table_cards, game=sg.game,
                      actions=sg.actions, log_lines=sg.log_lines)
        return MagicTable(table_name, table)

    def __init__(self, name, table: Table = None):
        if table:
            self.table = table
        else:
            self.table = Table(name=name, sf_cards=[], table_cards=[],
                               game=Game(cards=[], players=[], zones=[], battlefield_cards=[]),
                               actions=[], log_lines=[])
        self.indexed_game = IndexedGame(self.table.game)

    def add_player(self, join_request: JoinRequest):
        if [p for p in self.table.game.players if p.name == join_request.name]:
            return False  # already present

        # load cards into table
        sf_cards = join_request.deck
        self.table.sf_cards.extend(sf_cards)

        # skip 0, use block of 1000 per player
        cid = 1000 * (1 + len(self.table.game.players))
        seed(self.table.name, version=2)  # seed with table name for consistency in testing/debugging
        table_cards = [TableCard(cid + i, sf_card.sf_id, owner=join_request.name) for i, sf_card in enumerate(sf_cards)]
        self.table.table_cards.extend(table_cards)

        zid = len(self.table.game.zones)
        zones = [Zone(name=z, z_id=zid + i, owner=join_request.name, cards=[]) for i, z in enumerate(ZONES)]
        self.table.game.zones.extend(zones)

        # setup player fields
        commander_card_id = None
        if len(table_cards) >= 100:
            commander_card_id = table_cards[0].card_id  # we'll pull this card into cmd zone later
            library_size = 100
        elif len(table_cards) >= 60:
            # standard
            library_size = 60
        elif len(table_cards) >= 40:
            # limited
            library_size = 40
        elif len(table_cards) >= 30:
            # sealed league round 1
            library_size = 30
        else:
            library_size = len(table_cards)  # something else

        library_table_cards, extra_table_cards = table_cards[:library_size], table_cards[library_size:]

        # start with cards in library
        library_cards = [Card(card_id=c.card_id) for c in library_table_cards]
        if commander_card_id:
            commander_card = library_cards.pop(0)
            # commander format - put commander into command zone
            next((z for z in zones if z.name == COMMAND_ZONE)).cards.append(commander_card.card_id)
            self.table.game.cards.append(commander_card)
            commander_sfid = next((tc.sf_id for tc in table_cards if tc.card_id == commander_card_id))
            commander_name = next((sfc.name for sfc in sf_cards if sfc.sf_id == commander_sfid))
        else:
            commander_name = None
        library = next((z for z in zones if z.name == LIBRARY))
        library.cards.extend([c.card_id for c in library_cards])
        shuffle(library.cards)  # shuffle the library
        # extras into exile
        ex_cards = [Card(card_id=c.card_id) for c in extra_table_cards]
        next((z for z in zones if z.name == EXILE)).cards.extend([c.card_id for c in ex_cards])
        self.table.game.cards.extend(library_cards + ex_cards)

        # setup player
        z_ids = [z.z_id for z in zones]
        player = Player(name=join_request.name, color=join_request.color, counters=[], zones=z_ids)
        player.counters.append(Counter(name="Life", value=40 if commander_card_id is not None else 20))
        self.table.game.players.append(player)
        self.table.log_lines.append(LogLine(who=player.name, when=round(time.time()*1000),
                                            line=f"joined the table with {len(table_cards)} cards" +
                                                 f" led by {commander_name}." if commander_name else "."))
        self.indexed_game = IndexedGame(self.table.game)
        if not is_test(self.table.name):
            self.save()
        return True

    def save(self, sf_cards=True, table_cards=True):
        file_path = os.path.join(MagicTable.get_tables_path(), self.table.name)
        logger.info(f"Saving table to {file_path}")
        t0 = time.time()
        if sf_cards:
            persistence.save(file_path + ".sf_cards.json",
                             SFCard.schema().dumps(self.table.sf_cards, many=True))
        if table_cards:
            persistence.save(file_path + ".table_cards.json",
                             TableCard.schema().dumps(self.table.table_cards, many=True))
        # todo either find better append only data store for actions and log lines or split by 100s
        # since saving them gets linearly slower over the course of the game
        sg = SaveGame(self.table.game, self.table.actions, self.table.log_lines)
        persistence.save(file_path + SAVE_GAME_JSON, SaveGame.schema().dumps(sg))
        t1 = time.time()
        logger.info(f"Saved in {t1 - t0:.3f}s")

    def get_actions(self):
        return self.table.actions

    def get_cards(self):
        return SFCard.schema().dumps(self.table.sf_cards + MagicCards.get_all_tokens(), many=True)

    def resolve_action(self, action: PlayerAction) -> Tuple[Optional[Game], List[LogLine], List[TableCard]]:
        look_back = min(5, len(self.table.actions))
        if action in [a for a in self.table.actions[-look_back:]]:
            return None, [], []  # skip repeats
        game_updates_i = self.apply(action)
        # keep record
        self.table.actions.append(action)
        # apply to self
        self.table.game = self.indexed_game.merge(game_updates_i).to_game()
        if game_updates_i.log_updates:
            self.table.log_lines.extend(game_updates_i.log_updates)

        if not is_test(self.table.name):  # don't save test tables
            # only save if it was an action worth adding to the log (e.g. not hand re-ordering or bf re-arranging)
            if game_updates_i.log_updates:
                # only need to save sf cards on join. only need to save table cards if new ones created.
                self.save(sf_cards=False, table_cards=len(game_updates_i.card_updates) > 0)
        game_updates = game_updates_i.to_game()
        return game_updates, game_updates_i.log_updates, game_updates_i.card_updates

    ################################# Game state logic below #################################

    def apply(self, action: PlayerAction) -> IndexedGame:
        """returns updated portions of a game or None"""
        logger.info(f"applying {action}")

        game_updates_i: IndexedGame = IndexedGame()

        if action.card_moves:
            game_updates_i.merge(self.handle_move_cards(action))
        if action.card_changes or action.kind == UNTAP_ALL \
                or action.kind.startswith(SHUFFLE_LIBRARY) or action.kind == MULLIGAN:
            game_updates_i.merge(self.handle_card_changes(action))
        if action.counter_changes:
            game_updates_i.merge(self.handle_counter_changes(action))
        if action.create_tokens:
            game_updates_i.merge(self.handle_create_token(action))

        if action.kind == RANDOMNESS:
            line = MagicTable.do_random(action.when, action.message)
            game_updates_i.log_updates.append(LogLine(who=action.who, when=action.when, line=line))
        elif action.kind == MESSAGE and action.message:
            game_updates_i.log_updates.append(LogLine(who=action.who, when=action.when, line=action.message))

        logger.info(f"resulted in {game_updates_i}")
        return game_updates_i

    def handle_create_token(self, action: PlayerAction) -> IndexedGame:
        game_updates = IndexedGame()

        for create_token in action.create_tokens:
            table_card = TableCard(card_id=max([tc.card_id for tc in self.table.table_cards]) + 1,
                                   sf_id=create_token.sf_id, owner=create_token.owner, token=True)
            card = Card(table_card.card_id)
            game_updates.card_updates.append(table_card)
            self.table.table_cards.append(table_card)  # todo fix get_card_name_ to read updates to avoid modifying here
            game_updates.cards[card.card_id] = card
            bf = self.indexed_game.zones[action.who + "-" + BATTLEFIELD]
            bf.cards.append(card.card_id)
            game_updates.zones[action.who + "-" + BATTLEFIELD] = bf
            bf_card = BattlefieldCard(card_id=card.card_id, x=1, y=1, last_touched=action.when)
            game_updates.battlefield_cards[bf_card.card_id] = bf_card
            self.indexed_game.merge(game_updates)
            line = f"{action.who} created {self.get_card_name_for_log(card.card_id)}"
            game_updates.log_updates.append(LogLine(who=action.who, when=action.when, line=line))

        return game_updates

    def handle_counter_changes(self, action: PlayerAction) -> IndexedGame:
        game_updates = IndexedGame()

        for counter_change in action.counter_changes:
            new_counter = Counter(name=counter_change.name, value=counter_change.value) if counter_change.value \
                else None
            if counter_change.player:
                what = (counter_change.player + "'s") if counter_change.player != action.who else "their"
                player = self.indexed_game.players[counter_change.player]
                old_counter = next((c for c in player.counters if c.name == counter_change.name), None)
                if old_counter:
                    player.counters.remove(old_counter)
                if new_counter:
                    player.counters.append(new_counter)
                game_updates.players[counter_change.player] = player

            elif counter_change.card_id is not None:
                what = self.get_card_name_for_log(counter_change.card_id) + "'s"
                bf_card = self.indexed_game.battlefield_cards[counter_change.card_id]
                old_counter = next((c for c in bf_card.counters if c.name == counter_change.name), None)
                if old_counter:
                    bf_card.counters.remove(old_counter)
                if new_counter:
                    bf_card.counters.append(new_counter)
                game_updates.battlefield_cards[counter_change.card_id] = bf_card

            else:
                return game_updates  # not a supported counter change

            if old_counter and new_counter:
                line = f"changed {what} {counter_change.name} counter " \
                       f"from {old_counter.value} to {new_counter.value}"
            elif new_counter:
                line = f"set {what} {counter_change.name} counter to {new_counter.value}"
            else:
                line = f"removed {what} {old_counter.value if old_counter.value > 1 else ''}" \
                       f" {counter_change.name} counter{'s' if old_counter.value > 1 else ''}"
            game_updates.log_updates.append(LogLine(who=action.who, when=action.when, line=line))

        return game_updates

    def where_is_card(self, card_id: int) -> str:
        return next((z for z in self.indexed_game.zones.values() if card_id in z.cards)).name

    def get_card_name_for_log(self, card_id: int, card_move: CardMove = None) -> str:
        card_name = "a card"
        to_or_from_field = card_move and (card_move.src_zone in [BATTLEFIELD, GRAVEYARD]
                                          or card_move.tgt_zone in [BATTLEFIELD, GRAVEYARD])
        if to_or_from_field or self.where_is_card(card_id) in [BATTLEFIELD, GRAVEYARD]:
            card_state = self.indexed_game.cards[card_id]
            table_card = next(tc for tc in self.table.table_cards if tc.card_id == card_id)
            sf_card = next((sf for sf in self.table.sf_cards if sf.sf_id == table_card.sf_id), None)
            if not sf_card:  # if not in table cards check tokens
                sf_card = next((sf for sf in MagicCards.get_all_tokens() if sf.sf_id == table_card.sf_id))
            card_name = "a facedown card" if card_state.facedown else sf_card.name
        return card_name

    @staticmethod
    def do_random(when, message) -> str:
        seed(when, version=2)
        if message == "Coin Flip":
            return f"coin flip is {choice(['heads', 'tails'])}."
        elif message.startswith("Roll d"):
            size = int(message.replace("Roll d", ""))
            return f"rolled a {randint(1, size)} on a {message.split(' ')[1]}."

    @staticmethod
    def shuffle_library(owner, when, game, game_updates):
        library_card_ids = game.zones[owner + "-" + LIBRARY].cards
        seed(when, version=2)
        shuffle(library_card_ids)
        game_updates.zones[owner + "-" + LIBRARY] = game.zones[owner + "-" + LIBRARY]
        game_updates.zones[owner + "-" + LIBRARY].cards = library_card_ids

    def handle_card_changes(self, action: PlayerAction) -> IndexedGame:
        game_updates = IndexedGame()

        # per card
        for card_change in action.card_changes:
            if card_change.to_x is not None and card_change.to_y is not None:
                if card_change.card_id in self.indexed_game.battlefield_cards:
                    bf_card = self.indexed_game.battlefield_cards[card_change.card_id]
                else:
                    # create new battlefield card
                    bf_card = BattlefieldCard(card_id=card_change.card_id, x=0, y=0)
                    game_updates.battlefield_cards[bf_card.card_id] = bf_card
                bf_card.x = card_change.to_x
                bf_card.y = card_change.to_y
                bf_card.last_touched = action.when
                game_updates.battlefield_cards[bf_card.card_id] = bf_card
                self.indexed_game.merge(game_updates)
            elif card_change.change == TOGGLE_TAP_CARD:
                bf_card = self.indexed_game.battlefield_cards[card_change.card_id]
                bf_card.tapped = not bf_card.tapped
                game_updates.battlefield_cards[bf_card.card_id] = bf_card
                self.indexed_game.merge(game_updates)
                line = f"{'' if bf_card.tapped else 'un'}tapped {self.get_card_name_for_log(card_change.card_id)}"
                game_updates.log_updates.append(LogLine(who=action.who, when=action.when, line=line))
            elif card_change.change == TOGGLE_FLIP_CARD:
                bf_card = self.indexed_game.battlefield_cards[card_change.card_id]
                bf_card.flipped = not bf_card.flipped
                game_updates.battlefield_cards[bf_card.card_id] = bf_card
                self.indexed_game.merge(game_updates)
                line = f"{'' if bf_card.flipped else 'un'}flipped {self.get_card_name_for_log(card_change.card_id)}"
                game_updates.log_updates.append(LogLine(who=action.who, when=action.when, line=line))
            elif card_change.change == TOGGLE_FACEDOWN_CARD:
                card_state = self.indexed_game.cards[card_change.card_id]
                card_state.facedown = not card_state.facedown
                game_updates.cards[card_state.card_id] = card_state
                self.indexed_game.merge(game_updates)
                if self.where_is_card(card_change.card_id) in [BATTLEFIELD]:
                    line = "turned a card facedown" if card_state.facedown \
                        else f"turned {self.get_card_name_for_log(card_change.card_id)} face up"
                    game_updates.log_updates.append(LogLine(who=action.who, when=action.when, line=line))
            elif card_change.change == TOGGLE_TRANSFORM_CARD:
                card_state = self.indexed_game.cards[card_change.card_id]
                card_state.transformed = not card_state.transformed
                game_updates.cards[card_state.card_id] = card_state
                self.indexed_game.merge(game_updates)
                if self.where_is_card(card_change.card_id) in [BATTLEFIELD]:
                    line = f"{'transformed' if card_state.transformed else 'un-transformed'} " \
                           f"{self.get_card_name_for_log(card_change.card_id)}"
                    game_updates.log_updates.append(LogLine(who=action.who, when=action.when, line=line))

        # not per card
        if action.kind == UNTAP_ALL:
            card_ids = self.indexed_game.zones[action.who + "-" + BATTLEFIELD].cards
            count = 0
            for card_id in card_ids:
                bf_card = self.indexed_game.battlefield_cards[card_id]
                if bf_card.tapped:
                    bf_card.tapped = False
                    game_updates.battlefield_cards[bf_card.card_id] = bf_card
                    count += 1
            line = f"untapped {count} cards"
            game_updates.log_updates.append(LogLine(who=action.who, when=action.when, line=line))
        elif action.kind.startswith(SHUFFLE_LIBRARY):
            tgt_owner = action.kind.replace(SHUFFLE_LIBRARY + "_", "")
            MagicTable.shuffle_library(tgt_owner, action.when, self.indexed_game, game_updates)
            line = "shuffled " + ("their" if action.who == tgt_owner else f"{tgt_owner}'s") + " Library"
            game_updates.log_updates.append(LogLine(who=action.who, when=action.when, line=line))
        elif action.kind == MULLIGAN:
            mulls_so_far = len([a for a in self.table.actions if a.who == action.who and a.kind == MULLIGAN])
            if not [c for c in self.indexed_game.players[action.who].counters if c.name == 'Life' and c.value == 40]:
                # mulligans reduce your hand size by one, but commander has 1 free mulligan
                mulls_so_far += 1

            hand = self.indexed_game.zones[action.who + "-" + HAND]
            library = self.indexed_game.zones[action.who + "-" + LIBRARY]

            sub_kind = action.message
            if sub_kind == "London":
                replace_count = 7
                new_cards = 7 - mulls_so_far
                line = f"took a London mulligan to {new_cards} cards"
            elif sub_kind.startswith("Partial"):
                replace_count = int(sub_kind.split(' ')[1])
                new_cards = replace_count - (1 if mulls_so_far else 0)
                line = f"took a {replace_count} card partial mulligan to {7-mulls_so_far} cards"
            else:
                raise Exception("Unrecognized mulligan type " + sub_kind)
            # move hand cards to library
            library.cards += hand.cards[0:replace_count]
            hand.cards = hand.cards[replace_count:]
            game_updates.zones[action.who + "-" + HAND] = hand
            game_updates.zones[action.who + "-" + LIBRARY] = library
            # shuffle library
            MagicTable.shuffle_library(action.who, action.when, self.indexed_game, game_updates)
            # draw new cards to front of hand
            hand.cards = library.cards[:new_cards] + hand.cards
            library.cards = library.cards[new_cards:]

            game_updates.log_updates.append(LogLine(who=action.who, when=action.when, line=line))

        return game_updates

    def handle_move_cards(self, action: PlayerAction) -> IndexedGame:
        game_updates = IndexedGame()
        log_lines = []

        for card_move in action.card_moves:
            card_id = card_move.card_id
            same_owner = card_move.tgt_owner == card_move.src_owner
            same_zone = card_move.tgt_zone == card_move.src_zone

            # remove from src
            src_zone = self.indexed_game.zones[card_move.src_owner + "-" + card_move.src_zone]
            src_zone.cards.remove(card_move.card_id)
            game_updates.zones[card_move.src_owner + "-" + card_move.src_zone] = src_zone
            # TODO optimization: remove battlefield cards when cards no longer on battlefield
            # add to tgt

            if card_move.src_zone == BATTLEFIELD and not same_zone:
                # leaving battlefield logic
                bf_card = self.indexed_game.battlefield_cards[card_id]
                if bf_card.tapped or bf_card.flipped or bf_card.counters:
                    bf_card.tapped = False
                    bf_card.flipped = False
                    bf_card.counters = []
                    game_updates.battlefield_cards[bf_card.card_id] = bf_card

                if card_move.tgt_zone != EXILE:
                    # magic feature: tokens can't be anywhere except battlefield
                    table_card = next(tc for tc in self.table.table_cards if tc.card_id == card_id)
                    if table_card.token:
                        card_move.tgt_zone = EXILE  # enforce rule by overriding the action

            tgt_zone = self.indexed_game.zones[card_move.tgt_owner + "-" + card_move.tgt_zone]
            if card_move.to_idx is None:
                tgt_zone.cards.append(card_id)
            else:
                tgt_zone.cards.insert(card_move.to_idx, card_id)
            game_updates.zones[card_move.tgt_owner + "-" + card_move.tgt_zone] = tgt_zone

            # log it
            self.indexed_game.merge(game_updates)
            card_name = self.get_card_name_for_log(card_id, card_move)
            line = None
            if action.who == card_move.src_owner and card_move.src_zone == LIBRARY \
                    and card_move.tgt_zone == HAND and "Draw" in action.kind:
                line = "drew a card"
            elif action.who == card_move.src_owner and card_move.src_zone == HAND and card_move.tgt_zone == BATTLEFIELD:
                line = f"played {card_name}"
            elif action.who == card_move.src_owner and card_move.src_zone == HAND and card_move.tgt_zone == GRAVEYARD:
                line = f"discarded {card_name}"
            elif action.who == card_move.src_owner and card_move.tgt_zone == EXILE:
                line = f"exiled {card_name}"
            elif not same_owner or not same_zone or card_move.tgt_zone == LIBRARY:
                where = "the bottom of " if card_move.to_idx is None or card_move.to_idx == len(tgt_zone.cards) \
                    else "the top of " if card_move.to_idx == 0 \
                    else f"{card_move.to_idx} from top in "
                where = "" if card_move.tgt_zone != LIBRARY else where  # only card about order in library
                whose_src_zone = "their" if action.who == card_move.src_owner else f"{card_move.src_owner}'s"
                whose_tgt_zone = "their" if action.who == card_move.tgt_owner else f"{card_move.tgt_owner}'s"
                line = f"moved {card_name} from {whose_src_zone} {card_move.src_zone} " \
                       f"to {where}{whose_tgt_zone} {card_move.tgt_zone}"

            if line:
                log_lines.append(LogLine(who=action.who, when=action.when, line=line))

        if len(log_lines) > 1 and all(["drew a card" == ll.line for ll in log_lines]):
            log_lines = [LogLine(who=action.who, when=action.when, line=f"drew {len(log_lines)} cards")]
        game_updates.log_updates += log_lines

        return game_updates
