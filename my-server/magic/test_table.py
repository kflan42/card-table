import random

from magic_models import JoinRequest, get_zone, LIBRARY, ZONES, COMMAND_ZONE, Counter, HAND, BattlefieldCard, \
    BATTLEFIELD
from magic_table import MagicTable

arena_deck = "1 Abzan Charm (C16) 177\r\n1 Acidic Slime (MYS1) 165\r\n1 Acolyte of Affliction (THB) 206\r\n1 Altar of Dementia (MH1) 218\r\n1 Blossoming Sands (IKO) 244\r\n1 Boneyard Lurker (IKO) 178\r\n1 Carrion Feeder (MYS1) 81\r\n1 Caustic Caterpillar (MYS1) 170\r\n1 Chittering Harvester (IKO) 80\r\n1 Corpse Knight (M20) 206\r\n1 Cruel Celebrant (WAR) 188\r\n1 Dawntreader Elk (DKA)\r\n1 Devoted Druid (SHM) 162\r\n1 Dirge Bat (IKO) 84\r\n1 Divine Reckoning (C19) 62\r\n1 Drown in Filth (GK1) 60\r\n1 Duneblast (C16) 194\r\n1 Elvish Rejuvenator (M19) 180\r\n1 Evolving Wilds (IKO) 247\r\n1 Explosive Vegetation (MYS1) 144\r\n1 Farhaven Elf (C18) 146\r\n1 Fertilid (IKO) 152\r\n1 Final Parting (DAR) 93\r\n1 Fleshbag Marauder (CN2) 136\r\n9 Forest (IKO) 272\r\n1 Forsaken Sanctuary (C18) 247\r\n1 Foul Orchard (C19) 244\r\n1 Funeral Rites (THB) 97\r\n1 Gaze of Granite (GK1) 61\r\n1 Gemrazer (IKO) 155\r\n1 Glowspore Shaman (GRN) 173\r\n1 Golgari Grave-Troll (DDJ) 60\r\n1 Golgari Rot Farm (C19) 248\r\n1 Grapple with the Past (MYS1) 148\r\n1 Graypelt Refuge (MYS1) 249\r\n1 Grisly Salvage (GK1) 64\r\n1 Guardian Project (RNA) 130\r\n1 Harrow (MYS1) 174\r\n1 Insatiable Hemophage (IKO) 93\r\n1 Jade Mage (C13) 151\r\n1 Jarad's Orders (RTR)\r\n1 Jungle Hollow (IKO) 249\r\n1 Mentor of the Meek (M19) 27\r\n1 Merciless Executioner (FRF) 76\r\n1 Migration Path (IKO) 164\r\n1 Migratory Greathorn (IKO) 165\r\n1 Moldervine Reclamation (M20) 214\r\n1 Necropanther (IKO) 196\r\n1 Nethroi, Apex of Death (IKO) 197\r\n1 Nyx Weaver (JOU) 155\r\n1 Orzhov Basilica (MYS1) 297\r\n1 Path of Discovery (RIX) 142\r\n1 Perpetual Timepiece (KLD) 227\r\n1 Plaguecrafter (C19) 126\r\n3 Plains (IKO) 260\r\n1 Rampant Growth (MYS1) 48\r\n1 Ravenous Chupacabra (MYS1) 104\r\n1 Read the Bones (MYS1) 122\r\n1 Reclamation Sage (C18) 159\r\n1 Sakura-Tribe Elder (MYS1) 187\r\n1 Sandsteppe Citadel (MYS1) 305\r\n1 Satyr Wayfinder (CM1) 143\r\n1 Sawtusk Demolisher (C20) 64\r\n1 Scoured Barrens (IKO) 254\r\n1 Selesnya Sanctuary (C19) 272\r\n1 Shriekmaw (MYS1) 136\r\n1 Soul of the Harvest (EO2) 36\r\n1 Springbloom Druid (MH1) 181\r\n1 Stinkweed Imp (MYS1) 53\r\n1 Stitcher's Supplier (M19) 121\r\n10 Swamp (IKO) 266\r\n1 Syphon Mind (C17) 127\r\n1 Syr Konrad, the Grim (ELD) 107\r\n1 Temple of Malady (M20) 254\r\n1 Terramorphic Expanse (C19) 281\r\n1 Tranquil Expanse (C18) 289\r\n1 Vindictive Vampire (RNA) 90\r\n1 Vizier of Remedies (AKH) 38\r\n1 Winding Way (MH1) 193\r\n1 Yavimaya Granger (ULG)\r\n1 Zulaport Cutthroat (BFZ) 126\r\n\r\n"
txt_deck = "1 Akroma's Memorial\r\n1 Asceticism\r\n1 Avenger of Zendikar\r\n1 Beast Whisperer\r\n1 Beast Within\r\n1 Boseiju, Who Shelters All\r\n1 Castle Garenbrig\r\n1 Collector Ouphe\r\n1 Concordant Crossroads\r\n1 Craterhoof Behemoth\r\n1 Creeping Renaissance\r\n1 Cultivate\r\n1 Defense Grid\r\n1 Defense of the Heart\r\n1 Deserted Temple\r\n1 Dryad Arbor\r\n1 Elvish Mystic\r\n1 Eternal Witness\r\n1 Fabled Passage\r\n1 Finale of Devastation\r\n22 Forest\r\n1 Gaea's Cradle\r\n1 Genesis Wave\r\n1 Green Sun's Zenith\r\n1 Hall of Gemstone\r\n1 Heroic Intervention\r\n1 Kamahl, Fist of Krosa\r\n1 Karametra's Acolyte\r\n1 Karn Liberated\r\n1 Kenrith's Transformation\r\n1 Kogla, the Titan Ape\r\n1 Krosan Grip\r\n1 Llanowar Elves\r\n1 Llanowar Tribe\r\n1 Lotus Cobra\r\n1 Lurking Predators\r\n1 Mana Reflection\r\n1 Miren, the Moaning Well\r\n1 Misty Rainforest\r\n1 Nacatl War-Pride\r\n1 Natural Order\r\n1 Nature's Will\r\n1 Nevinyrral's Disk\r\n1 Nissa's Pilgrimage\r\n1 Nissa, Vastwood Seer\r\n1 Nykthos, Shrine to Nyx\r\n1 Nylea's Intervention\r\n1 Nyxbloom Ancient\r\n1 Ohran Frostfang\r\n1 Oracle of Mul Daya\r\n1 Praetor's Counsel\r\n1 Priest of Titania\r\n1 Questing Beast\r\n1 Regal Force\r\n1 Regrowth\r\n1 Reliquary Tower\r\n1 Return of the Wildspeaker\r\n1 Rings of Brighthearth\r\n1 Rishkar's Expertise\r\n1 Scavenging Ooze\r\n1 Seedborn Muse\r\n1 Selvala's Stampede\r\n1 Selvala, Heart of the Wilds\r\n1 Shamanic Revelation\r\n1 Skyshroud Claim\r\n1 Song of the Dryads\r\n1 Soul of the Harvest\r\n1 Spike Weaver\r\n1 Spore Frog\r\n1 Sylvan Library\r\n1 The Great Henge\r\n1 Verdant Catacombs\r\n1 Vigor\r\n1 Vivien, Monsters' Advocate\r\n1 Vorinclex, Voice of Hunger\r\n1 Windswept Heath\r\n1 Wood Elves\r\n1 Wooded Foothills\r\n1 Woodfall Primus\r\n"
arena_deck_w_side = "1 Angrath's Marauders (XLN) 132\r\n1 Arcane Signet (ELD) 331\r\n1 Ash Barrens (MYSTOR)\r\n1 Assemble the Legion (MYSTOR)\r\n1 Battlefield Forge (ORI) 244\r\n1 Blasphemous Act (C18) 120\r\n1 Boros Charm (GK1) 84\r\n1 Boros Signet (GK1) 97\r\n1 Bruse Tarl, Boorish Herder (C16) 30\r\n1 Captain of the Watch (DDO) 3\r\n1 Clifftop Retreat (DAR) 239\r\n1 Command Tower (ELD) 333\r\n1 Conch Horn (FEM)\r\n1 Deflecting Swat (C20) 50\r\n1 Dragon Fodder (MYSTOR)\r\n1 Eldrazi Monument (MYSTOR)\r\n1 Elspeth, Sun's Champion (DDO) 1\r\n1 Fervor (M13)\r\n1 Flawless Maneuver (IKO) 26\r\n1 Fumigate (KLD) 15\r\n1 Geist-Honored Monk (C14) 72\r\n1 Generous Gift (MH1) 11\r\n1 Gerrard, Weatherlight Hero (C19) 41\r\n1 Goblin Instigator (M19) 142\r\n1 Goblin Rabblemaster (DDT) 46\r\n1 Goldnight Commander (AVR)\r\n1 Grand Abolisher (E01) 12\r\n1 Grenzo, Havoc Raiser (CN2) 54\r\n1 Hanged Executioner (M20) 22\r\n1 Homeward Path (C16) 301\r\n1 Hordeling Outburst (A25) 134\r\n1 Humble Defector (A25) 135\r\n1 Idol of Oblivion (C19) 55\r\n1 Iroas, God of Victory (C16) 205\r\n1 Kher Keep (C13)\r\n1 Krenko's Command (MYSTOR)\r\n1 Land Tax (BBD) 94\r\n1 Legion Warboss (GRN) 109\r\n1 Legion's Landing (XLN) 22\r\n1 Lena, Selfless Champion (M19) 21\r\n1 Lightning Greaves (MYSTOR)\r\n1 Loyal Apprentice (C18) 23\r\n1 Magus of the Wheel (C19) 149\r\n1 Mass Hysteria (MRD)\r\n1 Mentor of the Meek (M19) 27\r\n1 Mogg War Marshal (MYSTOR)\r\n1 Molten Birth (M14) 147\r\n12 Mountain (IKO) 269\r\n1 Myriad Landscape (C19) 261\r\n1 Not Forgotten (SOI) 30\r\n1 Penance (EXO)\r\n1 Pia and Kiran Nalaar (DDU) 47\r\n10 Plains (IKO) 260\r\n1 Purphoros, God of the Forge (MYSTOR)\r\n1 Raise the Alarm (M20) 34\r\n1 Reflecting Pool (CNS) 210\r\n1 Resolute Blademaster (BFZ) 218\r\n1 Rootborn Defenses (MYSTOR)\r\n1 Rugged Prairie (EVE)\r\n1 Sacred Foundry (GRN) 254\r\n1 Scavenger Grounds (HOU) 182\r\n1 Secure the Wastes (DTK) 36\r\n1 Selfless Spirit (EMN) 40\r\n1 Servo Exhibition (KLD) 27\r\n1 Silence (M14)\r\n1 Skullclamp (MYSTOR)\r\n1 Smothering Tithe (RNA) 22\r\n1 Sol Ring (MYSTOR)\r\n1 Stormfront Riders (DDF)\r\n1 Strip Mine (ME4) 252\r\n1 Sunbaked Canyon (MH1) 247\r\n1 Talisman of Conviction (MH1) 230\r\n1 Teferi's Protection (MYSTOR)\r\n1 Temple of Triumph (M20) 257\r\n1 Tempt with Vengeance (C13) 125\r\n1 Thalia's Lancers (MYSTOR)\r\n1 Tome of Legends (ELD) 332\r\n1 Wear // Tear (DGM) 135\r\n1 Wheel of Fortune (ME4) 140\r\n1 Winota, Joiner of Forces (IKO) 216\r\n\r\n1 Break Through the Line (FRF) 94\r\n1 Chandra, Acolyte of Flame (M20) 126\r\n1 Dockside Extortionist (C19) 24\r\n1 Dolmen Gate (LRW)\r\n1 Impact Tremors (MYSTOR)\r\n1 Light Up the Stage (RNA) 107\r\n1 Make a Stand (M19)\r\n1 Satyr's Cunning (THB)\r\n1 Savage Beating (DST)\r\n1 Scroll Rack (TMP)\r\n1 Silverwing Squadron (ELD)\r\n1 Slate of Ancestry (EVG)\r\n1 Swiftfoot Boots (C18)\r\n1 Tectonic Reformation (MH1)\r\n1 Throne of the God-Pharaoh (AKH)"
tapped_out_deck = "1 Alchemist's Refuge\r\n1 Altered Ego\r\n1 Asceticism\r\n1 Assassin's Trophy\r\n1 Bayou\r\n1 Birds of Paradise\r\n1 Bloom Tender\r\n1 Blue Sun's Zenith\r\n1 Castle Garenbrig\r\n1 Cavern of Souls\r\n1 Chromatic Lantern\r\n1 City of Brass\r\n1 Command Tower\r\n1 Cyclonic Rift\r\n1 Damnation\r\n1 Darkslick Shores\r\n1 Deepglow Skate\r\n1 Demonic Tutor\r\n1 Dosan the Falling Leaf\r\n1 Doubling Season\r\n1 Dryad Arbor\r\n1 Elves of Deep Shadow\r\n1 Elvish Archdruid\r\n1 Elvish Mystic\r\n1 Exotic Orchard\r\n1 Expedition Map\r\n1 Exsanguinate\r\n1 Feral Hydra\r\n1 Nissa, Vastwood Seer\r\n6 Forest\r\n1 Freed from the Real\r\n1 Fyndhorn Elves\r\n1 Gaea's Cradle\r\n1 Gaea's Herald\r\n1 Gargos, Vicious Watcher\r\n1 Genesis Hydra\r\n1 Genesis Wave\r\n1 Green Sun's Zenith\r\n1 Grim Monolith\r\n1 Guardian Project\r\n1 Heroic Intervention\r\n1 Hooded Hydra\r\n1 Hungering Hydra\r\n1 Hydroid Krasis\r\n2 Island\r\n1 Karn's Bastion\r\n1 Krosan Grip\r\n1 Kruphix, God of Horizons\r\n1 Leyline of Anticipation\r\n1 Lifeblood Hydra\r\n1 Llanowar Elves\r\n1 Mana Confluence\r\n1 Mana Reflection\r\n1 Mistcutter Hydra\r\n1 Misty Rainforest\r\n1 Morphic Pool\r\n1 Muldrotha, the Gravetide\r\n1 Mystic Remora\r\n1 Oko, Thief of Crowns\r\n1 Path of Ancestry\r\n1 Pemmin's Aura\r\n1 Phyrexian Arena\r\n1 Polluted Delta\r\n1 Power Artifact\r\n1 Priest of Titania\r\n1 Primordial Hydra\r\n1 Pull from Tomorrow\r\n1 Reflecting Pool\r\n1 Rhystic Study\r\n1 Selvala, Heart of the Wilds\r\n1 Sol Ring\r\n1 Song of the Dryads\r\n1 Steelbane Hydra\r\n1 Stonecoil Serpent\r\n1 Stroke of Genius\r\n1 Swamp\r\n1 Sylvan Library\r\n1 Temple of the False God\r\n1 The Great Henge\r\n1 Torment of Hailfire\r\n1 Toxic Deluge\r\n1 Triumph of the Hordes\r\n1 Tropical Island\r\n1 Unbound Flourishing\r\n1 Underground River\r\n1 Underground Sea\r\n1 Urborg, Tomb of Yawgmoth\r\n1 Vampiric Tutor\r\n1 Vastwood Hydra\r\n1 Verdant Catacombs\r\n1 Villainous Wealth\r\n1 Voracious Hydra\r\n1 Watery Grave\r\n1 Zaxara, the Exemplary"


def test_table() -> MagicTable:
    table = MagicTable("test")
    # add players
    table.add_player(JoinRequest(name='alice', table='test', deck_list=arena_deck, color='Green'))
    table.add_player(JoinRequest(name='bob', table='test', deck_list=txt_deck, color='Red'))
    table.add_player(JoinRequest(name='Cool Person', table='test', deck_list=arena_deck_w_side, color='Blue'))
    table.add_player(JoinRequest(name='Definitely Dude', table='test', deck_list=tapped_out_deck, color='White'))

    # make it busy
    game = table.table.game
    for player in game.players:
        player.counters.append(Counter(name="Poison", value=random.randint(1, 10)))

        zs = {z: get_zone(game, player.name, z) for z in ZONES}
        # doing this in add player now
        # c = zs[LIBRARY].cards.pop()
        # zs[COMMAND_ZONE].cards.append(c)

        random.shuffle(zs[LIBRARY].cards)

        for i in range(7):
            c = zs[LIBRARY].cards.pop()
            zs[HAND].cards.append(c)

        bf_id = len(game.battlefield_cards)
        for i in range(7):
            c = zs[LIBRARY].cards.pop()
            bfc = BattlefieldCard(bf_id=bf_id + i, card_id=c, counters=[],
                                  x=random.randint(1, 19) * 5, y=random.randint(1, 19) * 5)
            bfc.tapped = random.choice([True, False, False, False])
            game.cards[c].facedown = random.choice([True, False, False, False])
            game.cards[c].transformed = random.choice([True, False, False, False])
            if random.randint(1, 2) == 2:
                bfc.counters.append(Counter(name="+1/+1", value=1))
            game.battlefield_cards.append(bfc)
            zs[BATTLEFIELD].cards.append(bfc.bf_id)

    return table
