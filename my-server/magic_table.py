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

CLEARING___ = "Clearing..."

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
    def list_table_files(session: str):
        table_files = persistence.ls_dir(f"{MagicTable.get_tables_path()}{os.path.sep}{session}{os.path.sep}")
        tables = []
        for (table_file, m_time) in table_files:
            if table_file.endswith(SAVE_GAME_JSON):
                table_name = table_file.replace(SAVE_GAME_JSON, '')
                tables.append((table_name, m_time))
        return tables

    @staticmethod
    def load(table_name, session_id='test'):
        file_path = os.path.join(MagicTable.get_tables_path(), session_id, table_name)
        sg = persistence.load(file_path + ".save_game.json",
                              decoder=lambda d: SaveGame.schema().loads(d))
        if not sg:
            return None
        # load the rest, stored in pieces
        sf_cards = load_cards(file_path=file_path + ".sf_cards.json")  # optimized for speed
        table_cards = persistence.load(file_path + ".table_cards.json",
                                       decoder=lambda d: TableCard.schema().loads(d, many=True))

        table = Table(sf_cards=sf_cards, table_cards=table_cards,
                      game=sg.game, actions=sg.actions, log_lines=sg.log_lines)
        return MagicTable(table_name, session_id=session_id, table=table)

    def __init__(self, name, session_id='test', table: Table = None):
        if table:
            self.table = table
        else:
            self.table = Table(sf_cards=[], table_cards=[],
                               game=Game(cards=[], players=[], zones=[], battlefield_cards=[]),
                               actions=[], log_lines=[])
        self.indexed_game = IndexedGame(self.table.game)
        self.last_save = time.time()
        self.name = name
        self.session_id = session_id
        self.reset_votes = set()

    def add_player(self, join_request: JoinRequest):
        game = self.table.game
        if [p for p in game.players if p.name == join_request.name]:
            return False  # already present

        # load cards into table
        self.table.sf_cards.extend(join_request.deck + join_request.sideboard)

        # skip 0, use block of 1000 per player
        cid = 1000 * (1 + len(game.players))
        table_cards = [TableCard(cid + i, sf_card.sf_id, owner=join_request.name)
                       for i, sf_card in enumerate(join_request.deck + join_request.sideboard)]
        self.table.table_cards.extend(table_cards)
        deck_size = len(join_request.deck)

        seed_str = f"{self.name}{len(self.table.log_lines)}"  # seed for consistency in testing/debugging
        commander_card_id = MagicTable.add_player_to_game(game, join_request.name, join_request.color,
                                                          table_cards[:deck_size], table_cards[deck_size:], seed_str)
        if commander_card_id:
            commander_sfid = next((tc.sf_id for tc in table_cards if tc.card_id == commander_card_id))
            commander_name = next((sfc.name for sfc in join_request.deck if sfc.sf_id == commander_sfid))
        else:
            commander_name = None
        self.table.log_lines.append(LogLine(who=join_request.name, when=round(time.time()*1000),
                                            line=f"joined the table with {len(table_cards)} cards" +
                                                 f" led by {commander_name}." if commander_name else "."))
        self.indexed_game = IndexedGame(game)
        if not is_test(self.name):
            self.save()
        return True

    @staticmethod
    def add_player_to_game(game, name, color, deck_cards: List[TableCard], sideboard: List[TableCard], seed_str):
        """Adds game cards, player, and zones for the inputs."""
        zid = len(game.zones)
        zones = [Zone(name=z, z_id=zid + i, owner=name, cards=[]) for i, z in enumerate(ZONES)]
        game.zones.extend(zones)

        # start with cards in library
        library_cards = [Card(card_id=c.card_id) for c in deck_cards]
        commander_card = None
        if len(library_cards) == 100:
            # commander format - put commander into command zone
            commander_card = library_cards.pop(0)
            next((z for z in zones if z.name == COMMAND_ZONE)).cards.append(commander_card.card_id)
            game.cards.append(commander_card)
        library = next((z for z in zones if z.name == LIBRARY))
        library.cards.extend([c.card_id for c in library_cards])
        seed(seed_str, version=2)
        shuffle(library.cards)  # shuffle the library

        # sideboard
        sideboard_cards = [Card(card_id=c.card_id) for c in sideboard]
        next((z for z in zones if z.name == SIDEBOARD)).cards.extend([c.card_id for c in sideboard])
        game.cards.extend(library_cards + sideboard_cards)
        # setup player
        z_ids = [z.z_id for z in zones]
        player = Player(name=name, color=color, counters=[], zones=z_ids)
        player.counters.append(Counter(name="Life", value=40 if commander_card else 20))
        game.players.append(player)
        return commander_card.card_id if commander_card else None

    def save(self, sf_cards=True, table_cards=True):
        file_path = os.path.join(MagicTable.get_tables_path(), self.session_id, self.name)
        logger.info(f"Saving table to {file_path}")
        t0 = time.time()
        if sf_cards:
            persistence.save(file_path + ".sf_cards.json",
                             SFCard.schema().dumps(self.table.sf_cards, many=True))
        if table_cards:
            persistence.save(file_path + ".table_cards.json",
                             TableCard.schema().dumps(self.table.table_cards, many=True))
        # actions are huge (~300b each) so only save last 100
        actions_to_save = self.table.actions[-100:]
        # log lines are usually <100b and aren't created for trivial actions like rearranging cards
        sg = SaveGame(self.table.game, actions_to_save, self.table.log_lines)
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

        if not is_test(self.name):  # don't save test tables
            # only save if it was an action worth adding to the log (e.g. not hand re-ordering or bf re-arranging)
            # only save at most every 10s
            # always save if need to add a table card
            now = time.time()
            new_table_cards = len(game_updates_i.card_updates) > 0
            if new_table_cards or (game_updates_i.log_updates and now > self.last_save + 10):
                self.last_save = now
                # only need to save sf cards on join
                # only need to save table cards if new ones created.
                self.save(sf_cards=False, table_cards=new_table_cards)
        game_updates = game_updates_i.to_game()
        return game_updates, game_updates_i.log_updates, game_updates_i.card_updates

    # ---------------- Game state logic below ----------------

    def reset_game(self) -> IndexedGame:
        g = Game(cards=[], players=[], zones=[], battlefield_cards=[])
        for p in self.table.game.players:
            table_cards = [tc for tc in self.table.table_cards if tc.owner == p.name]
            sideboard_ids = set([c for c in self.indexed_game.zones[f"{p.name}-{SIDEBOARD}"].cards])
            new_deck = [tc for tc in table_cards if tc.card_id not in sideboard_ids]
            sideboard_cards = [tc for tc in table_cards if tc.card_id in sideboard_ids]
            MagicTable.add_player_to_game(g, p.name, p.color, new_deck, sideboard_cards,
                                          f"{self.name}{len(self.table.log_lines)}")
        return IndexedGame(g)

    def apply(self, action: PlayerAction) -> IndexedGame:
        """returns updated portions of a game or None"""
        logger.info(f"applying {action}")

        game_updates_i: IndexedGame = IndexedGame()

        # whitelist what observers can do, so far just message as an anti-cheat mechanism
        if action.who not in self.indexed_game.players:
            if action.kind != MESSAGE:
                return game_updates_i

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
        elif action.kind == RESET:
            msg, fresh_game = self.vote_to_reset(action)
            if fresh_game:
                game_updates_i = fresh_game
            game_updates_i.log_updates.append(LogLine(who=action.who, when=action.when, line=msg))

        logger.info(f"resulted in {game_updates_i}")
        return game_updates_i

    def vote_to_reset(self, action):
        self.reset_votes.add(action.who)
        majority = len(self.indexed_game.players) // 2 + 1
        need = majority - len(self.reset_votes)
        if need:
            return f"voted to reset the game. {need} more votes will clear the game," \
                   f" resetting all zones! Tokens will vanish and cards not in sideboard will go to library.", None
        else:
            self.reset_votes.clear()
            return f"voted to reset the game. " + CLEARING___, self.reset_game()

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
            line = f"created {self.get_card_name_for_log(card.card_id)}"
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
        to_or_from_field = card_move and (card_move.src_zone in PUBLIC_ZONES
                                          or card_move.tgt_zone in PUBLIC_ZONES)
        if to_or_from_field or self.where_is_card(card_id) in PUBLIC_ZONES:
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
            mulls_so_far = 0
            for log_line in self.table.log_lines:
                if log_line.who == action.who and "mulligan" in log_line.line:
                    mulls_so_far += 1
                if CLEARING___ in log_line.line:
                    mulls_so_far = 0

            if not [c for c in self.indexed_game.players[action.who].counters if c.name == 'Life' and c.value == 40]:
                # mulligans reduce your hand size by one, but commander has 1 free mulligan
                mulls_so_far += 1

            hand = self.indexed_game.zones[action.who + "-" + HAND]
            library = self.indexed_game.zones[action.who + "-" + LIBRARY]

            sub_kind = action.message
            if sub_kind == "London":
                replace_count = 7
                new_cards = 7
                line = f"took a London mulligan, now must bury {mulls_so_far} cards"
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
