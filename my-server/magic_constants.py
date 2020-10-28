# constants
HAND = "Hand"
LIBRARY = "Library"
GRAVEYARD = "Graveyard"
COMMAND_ZONE = "Command Zone"
EXILE = "Exile"
SIDEBOARD = "Sideboard"
BATTLEFIELD = "Battlefield"
ZONES = [HAND, LIBRARY, GRAVEYARD, COMMAND_ZONE, EXILE, SIDEBOARD, BATTLEFIELD]

SHUFFLE_LIBRARY = 'SHUFFLE_LIBRARY'
MOVE_CARD = 'MOVE_CARD'
TOGGLE_TAP_CARD = 'TOGGLE_TAP_CARD'
TOGGLE_TRANSFORM_CARD = 'TOGGLE_TRANSFORM_CARD'
TOGGLE_FACEDOWN_CARD = 'TOGGLE_FACEDOWN_CARD'
TOGGLE_FLIP_CARD = 'TOGGLE_FLIP_CARD'
UNTAP_ALL = 'UNTAP_ALL'
SET_PLAYER_COUNTER = 'SET_PLAYER_COUNTER'
SET_CARD_COUNTER = 'SET_CARD_COUNTER'
CREATE_TOKEN = 'CREATE_TOKEN'
MESSAGE = 'MESSAGE'
RANDOMNESS = 'RANDOMNESS'
MULLIGAN = 'MULLIGAN'


class GameException(Exception):
    pass
