import logging
import os
from random import shuffle, seed

import persistence
from magic_cards import load_cards, CardResolver, parse_deck
from magic_constants import *
from magic_game import IndexedGame
from magic_models import *


class MagicTable:
    _tables_path: str = os.path.join('tables')
    _cards: List[SFCard] = None
    _tokens: List[SFCard] = None

    @staticmethod
    def get_tables_path():
        return MagicTable._tables_path

    @staticmethod
    def get_all_cards() -> List[SFCard]:
        if not MagicTable._cards:
            MagicTable._cards = load_cards()
        return MagicTable._cards

    @staticmethod
    def get_all_tokens() -> List[SFCard]:
        if not MagicTable._tokens:
            MagicTable._tokens = load_cards("tokens")
        return MagicTable._tokens

    @staticmethod
    def load(table_name):
        file_path = os.path.join(MagicTable.get_tables_path(), table_name + ".json")
        data = persistence.load(file_path)
        if data:
            return MagicTable(table_name, data)
        else:
            return None

    def __init__(self, name, data: dict = None):
        if data:
            self.table = Table.from_dict(data)
        else:
            self.table = Table(name=name, sf_cards=[], actions=[],
                               game=Game(cards=[], players=[], zones=[], battlefield_cards=[], action_log=[]))

    def add_player(self, join_request: JoinRequest):
        if [p for p in self.table.game.players if p.name == join_request.name]:
            return False  # already present

        table = self.table
        # load cards into table
        deck = parse_deck(join_request.deck_list)
        cr = CardResolver(MagicTable.get_all_cards())
        sf_cards = [cr.find_card(*c) for c in deck]
        table.sf_cards.extend(sf_cards)

        # shuffle the card ids we'll use, so that cid do not match deck list order
        cid = len(table.game.cards)
        c_ids = [i for i in range(cid, cid + len(sf_cards))]
        seed(self.table.name, version=2)  # seed with table name for consistency in testing/debugging
        shuffle(c_ids)

        zid = len(table.game.zones)
        zones = [Zone(name=z, z_id=zid + i, owner=join_request.name, cards=[]) for i, z in enumerate(ZONES)]
        table.game.zones.extend(zones)

        # setup player fields
        commander_sf_card = None
        if len(sf_cards) >= 100:
            commander_sf_card = sf_cards[-1]  # the deck parser puts commander last
            sf_cards.remove(commander_sf_card)
            library_size = 99
        elif len(sf_cards) >= 60:
            # standard
            library_size = 60
        elif len(sf_cards) >= 40:
            # limited
            library_size = 40
        elif len(sf_cards) >= 30:
            # sealed league round 1
            library_size = 30
        else:
            library_size = len(sf_cards)  # something else

        library_sf_cards, extra_sf_cards = sf_cards[:library_size], sf_cards[library_size:]

        # start with cards in library
        lib_cards = [Card(card_id=c_ids.pop(), sf_id=s.sf_id, owner=join_request.name) for s in library_sf_cards]
        library = next((z for z in zones if z.name == LIBRARY))
        library.cards.extend([c.card_id for c in lib_cards])
        shuffle(library.cards)  # shuffle the library
        # extras into exile
        ex_cards = [Card(card_id=c_ids.pop(), sf_id=s.sf_id, owner=join_request.name) for s in extra_sf_cards]
        next((z for z in zones if z.name == EXILE)).cards.extend([c.card_id for c in ex_cards])

        table.game.cards.extend(lib_cards + ex_cards)

        if commander_sf_card:
            commander_card = Card(card_id=c_ids.pop(), sf_id=commander_sf_card.sf_id, owner=join_request.name)
            # commander format - put commander into command zone
            next((z for z in zones if z.name == COMMAND_ZONE)).cards.append(commander_card.card_id)
            table.game.cards.append(commander_card)

        # setup player
        z_ids = [z.z_id for z in zones]
        player = Player(name=join_request.name, color=join_request.color, counters=[], zones=z_ids)
        player.counters.append(Counter(name="Life", value=40 if commander_sf_card else 20))
        table.game.players.append(player)
        return True

    def save(self):
        file_path = os.path.join(MagicTable.get_tables_path(), self.table.name + ".json")
        persistence.save(file_path, self.table.to_json())

    def get_actions(self):
        return self.table.actions

    def get_cards(self):
        return SFCard.schema().dumps(self.table.sf_cards + MagicTable.get_all_tokens(), many=True)

    def resolve_action(self, action: PlayerAction) -> Game:
        if action.when in [a.when for a in self.table.actions]:
            return None  # skip repeats
        game_updates_i = self.apply(action)
        # keep record
        self.table.actions.append(action)
        # apply to self
        self.table.game = IndexedGame(self.table.game).merge(game_updates_i).to_game()
        return game_updates_i.to_game()

    ################################# Game state logic below ########################

    def apply(self, action: PlayerAction) -> IndexedGame:
        """returns updated portions of a game or None"""
        action.card_moves = [CardMove(**c) for c in action.card_moves]
        action.card_changes = [CardChange(**c) for c in action.card_changes]
        action.create_tokens = [CreateToken(**c) for c in action.create_tokens]
        action.counter_changes = [CounterChange(**c) for c in action.counter_changes]
        logging.info(f"applying {action}")

        game_updates_i: IndexedGame = IndexedGame(
            Game(cards=[], players=[], zones=[], battlefield_cards=[], action_log=[]))

        self.indexed_game = IndexedGame(self.table.game)  # used for log line generation

        if action.card_moves:
            game_updates_i.merge(self.handle_move_cards(action))
        if action.card_changes or action.kind == UNTAP_ALL \
                or action.kind.startswith(SHUFFLE_LIBRARY) or action.kind == MULLIGAN:
            game_updates_i.merge(self.handle_card_changes(action))
        if action.kind in [SET_CARD_COUNTER, SET_PLAYER_COUNTER]:
            game_updates_i.merge(self.handle_counter_changes(action))
        if action.kind == CREATE_TOKEN:
            game_updates_i.merge(self.handle_create_token(action))

        if action.kind == MESSAGE:
            game_updates_i.action_log.append(LogLine(who=action.who, when=action.when, line=action.message))

        logging.info(f"resulted in {game_updates_i}")
        return game_updates_i

    def handle_create_token(self, action: PlayerAction) -> IndexedGame:
        game = IndexedGame(self.table.game)
        game_updates = IndexedGame(Game(cards=[], players=[], zones=[], battlefield_cards=[], action_log=[]))

        for create_token in action.create_tokens:
            card = Card(card_id=len(game.cards), sf_id=create_token.sf_id, owner=create_token.owner, token=True)
            game_updates.cards[card.card_id] = card
            bf = game.zones[action.who + "-" + BATTLEFIELD]
            bf.cards.append(card.card_id)
            game_updates.zones[action.who + "-" + BATTLEFIELD] = bf
            bf_card = BattlefieldCard(card_id=card.card_id, x=1, y=1, last_touched=action.when)
            game_updates.battlefield_cards[bf_card.card_id] = bf_card
            self.indexed_game.merge(game_updates)
            line = f"{action.who} created {self.get_card_name_for_log(card.card_id)}"
            game_updates.action_log.append(LogLine(who=action.who, when=action.when, line=line))

        return game_updates

    def handle_counter_changes(self, action: PlayerAction) -> IndexedGame:
        game = IndexedGame(self.table.game)
        game_updates = IndexedGame(Game(cards=[], players=[], zones=[], battlefield_cards=[], action_log=[]))

        for counter_change in action.counter_changes:
            new_counter = Counter(name=counter_change.name, value=counter_change.value) if counter_change.value \
                else None
            if counter_change.player:
                what = (counter_change.player + "'s") if counter_change.player != action.who else "their"
                player = game.players[counter_change.player]
                old_counter = next((c for c in player.counters if c.name == counter_change.name), None)
                if old_counter:
                    player.counters.remove(old_counter)
                if new_counter:
                    player.counters.append(new_counter)
                game_updates.players[counter_change.player] = player

            elif counter_change.card_id is not None:
                what = self.get_card_name_for_log(counter_change.card_id) + "'s"
                bf_card = game.battlefield_cards[counter_change.card_id]
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
            game_updates.action_log.append(LogLine(who=action.who, when=action.when, line=line))

        return game_updates

    def where_is_card(self, card_id: int) -> str:
        return next((z for z in self.indexed_game.zones.values() if card_id in z.cards)).name

    def get_card_name_for_log(self, card_id: int, card_move: CardMove = None) -> str:
        card_name = "a card"
        to_or_from_field = card_move and (card_move.src_zone in [BATTLEFIELD, GRAVEYARD]
                                          or card_move.tgt_zone in [BATTLEFIELD, GRAVEYARD])
        if to_or_from_field or self.where_is_card(card_id) in [BATTLEFIELD, GRAVEYARD]:
            card_state = self.indexed_game.cards[card_id]
            sf_card = next((sf for sf in self.table.sf_cards if sf.sf_id == card_state.sf_id), None)
            if not sf_card:  # if not in table cards check tokens
                sf_card = next((sf for sf in MagicTable.get_all_tokens() if sf.sf_id == card_state.sf_id))
            card_name = "a facedown card" if card_state.facedown else sf_card.name
        return card_name

    @staticmethod
    def shuffle_library(owner, when, game, game_updates):
        library_card_ids = game.zones[owner + "-" + LIBRARY].cards
        seed(when, version=2)
        shuffle(library_card_ids)
        game_updates.zones[owner + "-" + LIBRARY] = game.zones[owner + "-" + LIBRARY]
        game_updates.zones[owner + "-" + LIBRARY].cards = library_card_ids

    def handle_card_changes(self, action: PlayerAction) -> IndexedGame:
        game = IndexedGame(self.table.game)
        game_updates = IndexedGame(Game(cards=[], players=[], zones=[], battlefield_cards=[], action_log=[]))

        # per card
        for card_change in action.card_changes:
            if card_change.to_x is not None and card_change.to_y is not None:
                if card_change.card_id in game.battlefield_cards:
                    bf_card = game.battlefield_cards[card_change.card_id]
                else:
                    # create new battlefield card
                    bf_card = BattlefieldCard(card_id=card_change.card_id, x=0, y=0)
                    game.battlefield_cards[bf_card.card_id] = bf_card
                bf_card.x = card_change.to_x
                bf_card.y = card_change.to_y
                bf_card.last_touched = action.when
                game_updates.battlefield_cards[bf_card.card_id] = bf_card
                self.indexed_game.merge(game_updates)
            elif card_change.change == TOGGLE_TAP_CARD:
                bf_card = game.battlefield_cards[card_change.card_id]
                bf_card.tapped = not bf_card.tapped
                game_updates.battlefield_cards[bf_card.card_id] = bf_card
                self.indexed_game.merge(game_updates)
                line = f"{'' if bf_card.tapped else 'un'}tapped {self.get_card_name_for_log(card_change.card_id)}"
                game_updates.action_log.append(LogLine(who=action.who, when=action.when, line=line))
            elif card_change.change == TOGGLE_FACEDOWN_CARD:
                card_state = game.cards[card_change.card_id]
                card_state.facedown = not card_state.facedown
                game_updates.cards[card_state.card_id] = card_state
                self.indexed_game.merge(game_updates)
                if self.where_is_card(card_change.card_id) in [BATTLEFIELD]:
                    line = "turned a card facedown" if card_state.facedown \
                        else f"turned {self.get_card_name_for_log(card_change.card_id)} face up"
                    game_updates.action_log.append(LogLine(who=action.who, when=action.when, line=line))
            elif card_change.change == TOGGLE_TRANSFORM_CARD:
                card_state = game.cards[card_change.card_id]
                card_state.transformed = not card_state.transformed
                game_updates.cards[card_state.card_id] = card_state
                self.indexed_game.merge(game_updates)
                if self.where_is_card(card_change.card_id) in [BATTLEFIELD]:
                    line = f"{'transformed' if card_state.transformed else 'un-transformed'} " \
                           f"{self.get_card_name_for_log(card_change.card_id)}"
                    game_updates.action_log.append(LogLine(who=action.who, when=action.when, line=line))

        # not per card
        if action.kind == UNTAP_ALL:
            card_ids = game.zones[action.who + "-" + BATTLEFIELD].cards
            count = 0
            for card_id in card_ids:
                bf_card = game.battlefield_cards[card_id]
                if bf_card.tapped:
                    bf_card.tapped = False
                    game_updates.battlefield_cards[bf_card.card_id] = bf_card
                    count += 1
            line = f"untapped {count} cards"
            game_updates.action_log.append(LogLine(who=action.who, when=action.when, line=line))
        elif action.kind.startswith(SHUFFLE_LIBRARY):
            tgt_owner = action.kind.replace(SHUFFLE_LIBRARY + "_", "")
            MagicTable.shuffle_library(tgt_owner, action.when, game, game_updates)
            line = "shuffled " + ("their" if action.who == tgt_owner else f"{tgt_owner}'s") + " library"
            game_updates.action_log.append(LogLine(who=action.who, when=action.when, line=line))
        elif action.kind == MULLIGAN:
            # move hand cards to library
            hand = game.zones[action.who + "-" + HAND]
            library = game.zones[action.who + "-" + LIBRARY]
            library.cards += hand.cards
            hand.cards.clear()
            game_updates.zones[action.who + "-" + HAND] = hand
            game_updates.zones[action.who + "-" + LIBRARY] = library
            # shuffle library
            MagicTable.shuffle_library(action.who, action.when, game, game_updates)
            # draw 7
            hand.cards, library.cards = library.cards[:7], library.cards[7:]
            line = "took a mulligan"
            game_updates.action_log.append(LogLine(who=action.who, when=action.when, line=line))

        return game_updates

    def handle_move_cards(self, action: PlayerAction) -> IndexedGame:
        game = IndexedGame(self.table.game)
        game_updates = IndexedGame(Game(cards=[], players=[], zones=[], battlefield_cards=[], action_log=[]))
        log_lines = []

        for card_move in action.card_moves:
            card_id = card_move.card_id
            same_owner = card_move.tgt_owner == card_move.src_owner
            same_zone = card_move.tgt_zone == card_move.src_zone

            # remove from src
            src_zone = game.zones[card_move.src_owner + "-" + card_move.src_zone]
            src_zone.cards.remove(card_move.card_id)
            game_updates.zones[card_move.src_owner + "-" + card_move.src_zone] = src_zone
            # TODO optimization: remove battlefield cards when cards no longer on battlefield
            # add to tgt

            # magic feature: tokens can't be anywhere except battlefield
            if card_move.src_zone == BATTLEFIELD and not same_zone and card_move.tgt_zone != EXILE:
                card_state = game.cards[card_id]
                sf_token = next((sf for sf in MagicTable.get_all_tokens() if sf.sf_id == card_state.sf_id), None)
                if sf_token:
                    card_move.tgt_zone = EXILE  # enforce rule by overriding the action

            tgt_zone = game.zones[card_move.tgt_owner + "-" + card_move.tgt_zone]
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
        game_updates.action_log += log_lines

        return game_updates
