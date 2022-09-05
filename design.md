Front End "not-quite entity relationship" diagram:
```mermaid
erDiagram
    LANDING-PAGE {
        url url "/index.html"
        prop session
        method join "join(session) -> navigate"
    }
    LANDING-PAGE ||--|{ LOBBY-PAGE : goto
    LOBBY-PAGE {
        url url "/room?session=abc"
        prop playerName
        prop sleeveColor
        method playerEdit
        method onPlayerUpdate
        localStorage playerName
        localStorage sleeveColor
    }
    LOBBY-PAGE ||--|| DECK-LOADER : has
    DECK-LOADER {
        prop deckList
        prop cardList
        method upload "upload(txt) -> cards"
        localStorage deckList
        localStorage cardList
    }
    LOBBY-PAGE ||--|| TABLE-LIST: has
    TABLE-LIST {
        prop tables
        prop name
        method onTables "sent initially and on creates or joins"
        method create "(table)"
        method watch "(table)"
        method join "(table, player, color, deck)"
    }
    TABLE-LIST ||--|{ TABLE : goto
    TABLE {
        url url "/table?session=abc&table=123"
        prop game "players[], battlefield, log, ..."
        prop clientState "player, options"
        method gameAction
        method onGameUpdate
        method infoAction
        method onInfoUpdate
        method resetGame
        method leave "button or trigger on idle"
    }
```

Back End "not-quite entity relationship" diagram:
```mermaid
erDiagram
    SERVER-PY {
        PUT edit_player "name, color"
        WS room_ws "join, players, tables, disonnect"
        PUT create_table "name"
        PUT join_table "table, player, deck?"
        POST parse "deck list -> message, SFCard[]"
        WS game_ws "join_table, game|info x action|emit, disconnect"

    }
    SERVER-PY ||--|{ ROOM-PY : creates
    SERVER-PY ||--|{ CARDS-PY : calls
    ROOM-PY {
        method create_table
        method get_tables
        method join_table
    }
    CARDS-PY {
        method init_cache
        method parse_deck_list
    }
    ROOM-PY ||--|{ TABLE-PY : creates
    TABLE-PY {
        prop game "<data model here>"
        method actions "<virtual logic here>"
        method save
    }
    TABLE-PY }|--|| BUCKET : stored_in
    BUCKET {
        blob json "/session/table.*.json"
    }
```

The above are based on an earlier design doc I made at [diagrams.net](https://app.diagrams.net/#G1VzVYroTFGN9OCPzqnnTsSIXlY-MaFofX).

The current code doesn't match these exactly, but does follow the same general ideas.
