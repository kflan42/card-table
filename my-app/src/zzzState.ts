import { Game, Card, Player, Zone, Battlefield, BattlefieldCard } from './ClientState'
import { randint, randchoice } from './Utilities';
import { colors } from './view/Login';


export function createGame(users: string[], decks: string[][]): Game {
    var cards: { [index: number]: Card } = {};
    var players: { [index: string]: Player } = {}
    var zones: { [index: number]: Zone } = {}
    var battlefields: { [index: string]: Battlefield } = {}
    var battlefieldCards: { [index: number]: BattlefieldCard } = {}

    var cid = 0;
    var zid = 0;
    for (var p = 0; p < users.length; ++p) {
        const playerName = users[p];
        players[playerName] = {
            name: users[p],
            deck: [],
            zones: {
                "Hand": zid++,
                "Library": zid++,
                "Graveyard": zid++,
                "Command Zone": zid++,
                "Exile": zid++,
            },
            counters: {
                "Life": 40
            },
            color: randchoice(Object.keys(colors))
        }

        battlefields[playerName] = {
            battlefieldCards: []
        }

        var libraryZoneId = -1
        for (const zoneName in players[playerName].zones) {
            const zoneId = players[playerName].zones[zoneName]
            if (zoneName === "Library") libraryZoneId = zoneId
            zones[zoneId] = {
                id: zoneId,
                name: zoneName,
                owner: playerName,
                cards: []
            }
        }

        for (var d = 0; d < decks[p].length; d++) {
            const deckCard = decks[p][d]
            if (deckCard === "") {
                break; // end of deck, start of sideboard
            }

            // previous regex based approach
            // parens and space question mark are finicky
            // assume no cards have () in the name, only un-sets do
            // const cardLine = /(\d+)x? ([^(]+[^( ]) ?(?:\((\w+)?\))? ?(\d+)?/
            // const m = deckCard.match(cardLine)
            // if (!m) {
            //     console.error(`Invalid Line in Deck: ${deckCard}`)
            //     continue;
            // }
            // const count = Number.parseInt(m[1])
            // const name = m[2]
            // // only care about official 3 character sets
            // const set = m[3] && m[3].length === 3 ? m[3] : undefined
            // const setNumber = m[4] && m[4] ? m[4] : undefined

            const cardParts = deckCard.split(" ")
            const count = Number.parseInt(cardParts[0].replace("x", ""))
            var set = undefined, setNumber = undefined;
            if (cardParts.length > 3) { // count "name" (set) num // plus spaces in name
                const m = cardParts[cardParts.length - 2].match(/\((\w+)\)/);
                if (m) {
                    set = m[1];
                    setNumber = cardParts[cardParts.length - 1]; // not always numeric
                }
            }
            if (cardParts.length > 2) { // count "name" (set) // plus spaces in name
                const m = cardParts[cardParts.length - 1].match(/\((\w+)\)/);
                if (m) {
                    set = m[1];
                    // no set number if set last
                }
            }
            // else just count "name" // plus spaces in name
            const nameParts = cardParts.length - 1 - (set ? 1 : 0) - (setNumber ? 1 : 0)
            const name = cardParts.slice(1, nameParts + 1).join(" ")
            for (let i = 0; i < count; i++) {
                cards[cid] = {
                    id: cid,
                    name: name,
                    set: set,
                    setNumber: setNumber,
                    owner: playerName
                }
                players[playerName].deck.push(cid)
                zones[libraryZoneId].cards.push(cid)
                cid++
            }
        }

        console.log(players, cards)

        const deckSize = players[playerName].deck.length;
        console.log(`${playerName}'s deck has ${deckSize} cards and the commander `
            + `is ${cards[players[playerName].deck[deckSize - 1]].name}`)
    }
    return {
        players: players,
        battlefields: battlefields,
        zones: zones,
        cards: cards,
        battlefieldCards: battlefieldCards
    };
}

export function getZone(game: Game, player: string, zone: string) {
    const zoneId = game.players[player].zones[zone]
    return game.zones[zoneId]
}

export function createTestGame() {
    const initialGame = createGame(["alice", "bob",
        "chad", "dude",
        "erwin"],
        [xMarksTheSpot, kickStartMyHeart,
            xMarksTheSpot, kickStartMyHeart,
            xMarksTheSpot
        ])

    var bfId = 0;
    for (const pn in initialGame.players) {
        const library = getZone(initialGame, pn, "Library")
        const commandZone = getZone(initialGame, pn, "Command Zone")
        const hand = getZone(initialGame, pn, "Hand")
        const battlefield = initialGame.battlefields[pn]

        var c = library.cards.pop()
        if (c) commandZone.cards.push(c)

        for (let i = 0; i < 7; i++) {
            // drawing a card, ta-da!
            c = library.cards.pop()
            if (c) hand.cards.push(c)
        }

        for (let i = 0; i < 7; i++) {
            c = library.cards.pop()
            if (c) {
                const bfc: BattlefieldCard = {
                    bfId: ++bfId,
                    cardId: c,
                    x: randint(8) * 10 + 5,
                    y: randint(8) * 10 + 5,
                    tapped: randchoice([true, false, false, false]),
                    facedown: randchoice([true, false, false, false]),
                    transformed: randchoice([true, false]),
                    counters: randchoice([{}, { "+1/+1": 1 }])
                }
                initialGame.battlefieldCards[bfc.bfId] = bfc
                battlefield.battlefieldCards.push(bfc.bfId)
            }
        }
    }

    return initialGame;
}

/* mtg arena format */
const kickStartMyHeart = [
    "1 Angrath's Marauders (XLN) 132",
    "1 Arcane Signet (ELD) 331",
    "1 Ash Barrens (MYSTOR)",
    "1 Assemble the Legion (MYSTOR)",
    "1 Battlefield Forge (ORI) 244",
    "1 Blasphemous Act (C18) 120",
    "1 Boros Charm (GK1) 84",
    "1 Boros Signet (GK1) 97",
    "1 Bruse Tarl, Boorish Herder (C16) 30",
    "1 Captain of the Watch (DDO) 3",
    "1 Clifftop Retreat (DAR) 239",
    "1 Command Tower (ELD) 333",
    "1 Conch Horn (FEM)",
    "1 Deflecting Swat (C20) 50",
    "1 Dragon Fodder (MYSTOR)",
    "1 Eldrazi Monument (MYSTOR)",
    "1 Elspeth, Sun's Champion (DDO) 1",
    "1 Fervor (M13)",
    "1 Flawless Maneuver (IKO) 26",
    "1 Fumigate (KLD) 15",
    "1 Geist-Honored Monk (C14) 72",
    "1 Generous Gift (MH1) 11",
    "1 Gerrard, Weatherlight Hero (C19) 41",
    "1 Goblin Instigator (M19) 142",
    "1 Goblin Rabblemaster (DDT) 46",
    "1 Goldnight Commander (AVR)",
    "1 Grand Abolisher (E01) 12",
    "1 Grenzo, Havoc Raiser (CN2) 54",
    "1 Hanged Executioner (M20) 22",
    "1 Homeward Path (C16) 301",
    "1 Hordeling Outburst (A25) 134",
    "1 Humble Defector (A25) 135",
    "1 Idol of Oblivion (C19) 55",
    "1 Iroas, God of Victory (C16) 205",
    "1 Kher Keep (C13)",
    "1 Krenko's Command (MYSTOR)",
    "1 Land Tax (BBD) 94",
    "1 Legion Warboss (GRN) 109",
    "1 Legion's Landing (XLN) 22",
    "1 Lena, Selfless Champion (M19) 21",
    "1 Lightning Greaves (MYSTOR)",
    "1 Loyal Apprentice (C18) 23",
    "1 Magus of the Wheel (C19) 149",
    "1 Mass Hysteria (MRD)",
    "1 Mentor of the Meek (M19) 27",
    "1 Mogg War Marshal (MYSTOR)",
    "1 Molten Birth (M14) 147",
    "12 Mountain (IKO) 269",
    "1 Myriad Landscape (C19) 261",
    "1 Not Forgotten (SOI) 30",
    "1 Penance (EXO)",
    "1 Pia and Kiran Nalaar (DDU) 47",
    "10 Plains (IKO) 260",
    "1 Purphoros, God of the Forge (MYSTOR)",
    "1 Raise the Alarm (M20) 34",
    "1 Reflecting Pool (CNS) 210",
    "1 Resolute Blademaster (BFZ) 218",
    "1 Rootborn Defenses (MYSTOR)",
    "1 Rugged Prairie (EVE)",
    "1 Sacred Foundry (GRN) 254",
    "1 Scavenger Grounds (HOU) 182",
    "1 Secure the Wastes (DTK) 36",
    "1 Selfless Spirit (EMN) 40",
    "1 Servo Exhibition (KLD) 27",
    "1 Silence (M14)",
    "1 Skullclamp (MYSTOR)",
    "1 Smothering Tithe (RNA) 22",
    "1 Sol Ring (MYSTOR)",
    "1 Stormfront Riders (DDF)",
    "1 Strip Mine (ME4) 252",
    "1 Sunbaked Canyon (MH1) 247",
    "1 Talisman of Conviction (MH1) 230",
    "1 Teferi's Protection (MYSTOR)",
    "1 Temple of Triumph (M20) 257",
    "1 Tempt with Vengeance (C13) 125",
    "1 Thalia's Lancers (MYSTOR)",
    "1 Tome of Legends (ELD) 332",
    "1 Wear // Tear (DGM) 135",
    "1 Wheel of Fortune (ME4) 140",
    "1 Winota, Joiner of Forces (IKO) 216",
    "", //sideboard below here
    "1 Break Through the Line (FRF) 94",
    "1 Chandra, Acolyte of Flame (M20) 126",
    "1 Dockside Extortionist (C19) 24",
    "1 Dolmen Gate (LRW)",
    "1 Impact Tremors (MYSTOR)",
    "1 Light Up the Stage (RNA) 107",
    "1 Make a Stand (M19)",
    "1 Satyr's Cunning (THB)",
    "1 Savage Beating (DST)",
    "1 Scroll Rack (TMP)",
    "1 Silverwing Squadron (ELD)",
    "1 Slate of Ancestry (EVG)",
    "1 Swiftfoot Boots (C18)",
    "1 Tectonic Reformation (MH1)",
    "1 Throne of the God-Pharaoh (AKH)",
]

/* tapped out txt format */
const xMarksTheSpot = [
    "1 Alchemist's Refuge",
    "1 Altered Ego",
    "1 Asceticism",
    "1 Assassin's Trophy",
    "1 Bayou",
    "1 Birds of Paradise",
    "1 Bloom Tender",
    "1 Blue Sun's Zenith",
    "1 Castle Garenbrig",
    "1 Cavern of Souls",
    "1 Chromatic Lantern",
    "1 City of Brass",
    "1 Command Tower",
    "1 Cyclonic Rift",
    "1 Damnation",
    "1 Darkslick Shores",
    "1 Deepglow Skate",
    "1 Demonic Tutor",
    "1 Dosan the Falling Leaf",
    "1 Doubling Season",
    "1 Dryad Arbor",
    "1 Elves of Deep Shadow",
    "1 Elvish Archdruid",
    "1 Elvish Mystic",
    "1 Exotic Orchard",
    "1 Expedition Map",
    "1 Exsanguinate",
    "1 Feral Hydra",
    "1 Nissa, Vastwood Seer",
    "6 Forest",
    "1 Freed from the Real",
    "1 Fyndhorn Elves",
    "1 Gaea's Cradle",
    "1 Gaea's Herald",
    "1 Gargos, Vicious Watcher",
    "1 Genesis Hydra",
    "1 Genesis Wave",
    "1 Green Sun's Zenith",
    "1 Grim Monolith",
    "1 Guardian Project",
    "1 Heroic Intervention",
    "1 Hooded Hydra",
    "1 Hungering Hydra",
    "1 Hydroid Krasis",
    "2 Island",
    "1 Karn's Bastion",
    "1 Krosan Grip",
    "1 Kruphix, God of Horizons",
    "1 Leyline of Anticipation",
    "1 Lifeblood Hydra",
    "1 Llanowar Elves",
    "1 Mana Confluence",
    "1 Mana Reflection",
    "1 Mistcutter Hydra",
    "1 Misty Rainforest",
    "1 Morphic Pool",
    "1 Muldrotha, the Gravetide",
    "1 Mystic Remora",
    "1 Oko, Thief of Crowns",
    "1 Path of Ancestry",
    "1 Pemmin's Aura",
    "1 Phyrexian Arena",
    "1 Polluted Delta",
    "1 Power Artifact",
    "1 Priest of Titania",
    "1 Primordial Hydra",
    "1 Pull from Tomorrow",
    "1 Reflecting Pool",
    "1 Rhystic Study",
    "1 Selvala, Heart of the Wilds",
    "1 Sol Ring",
    "1 Song of the Dryads",
    "1 Steelbane Hydra",
    "1 Stonecoil Serpent",
    "1 Stroke of Genius",
    "1 Swamp",
    "1 Sylvan Library",
    "1 Temple of the False God",
    "1 The Great Henge",
    "1 Torment of Hailfire",
    "1 Toxic Deluge",
    "1 Triumph of the Hordes",
    "1 Tropical Island",
    "1 Unbound Flourishing",
    "1 Underground River",
    "1 Underground Sea",
    "1 Urborg, Tomb of Yawgmoth",
    "1 Vampiric Tutor",
    "1 Vastwood Hydra",
    "1 Verdant Catacombs",
    "1 Villainous Wealth",
    "1 Voracious Hydra",
    "1 Watery Grave",
    "1 Zaxara, the Exemplary"
]