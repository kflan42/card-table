import logging
import sys
import unittest

from magic_table import MagicTable, parse_deck, CardResolver

arena_deck = "1 Abzan Charm (C16) 177\r\n1 Acidic Slime (MYS1) 165\r\n1 Acolyte of Affliction (THB) 206\r\n1 Altar of Dementia (MH1) 218\r\n1 Blossoming Sands (IKO) 244\r\n1 Boneyard Lurker (IKO) 178\r\n1 Carrion Feeder (MYS1) 81\r\n1 Caustic Caterpillar (MYS1) 170\r\n1 Chittering Harvester (IKO) 80\r\n1 Corpse Knight (M20) 206\r\n1 Cruel Celebrant (WAR) 188\r\n1 Dawntreader Elk (DKA)\r\n1 Devoted Druid (SHM) 162\r\n1 Dirge Bat (IKO) 84\r\n1 Divine Reckoning (C19) 62\r\n1 Drown in Filth (GK1) 60\r\n1 Duneblast (C16) 194\r\n1 Elvish Rejuvenator (M19) 180\r\n1 Evolving Wilds (IKO) 247\r\n1 Explosive Vegetation (MYS1) 144\r\n1 Farhaven Elf (C18) 146\r\n1 Fertilid (IKO) 152\r\n1 Final Parting (DAR) 93\r\n1 Fleshbag Marauder (CN2) 136\r\n9 Forest (IKO) 272\r\n1 Forsaken Sanctuary (C18) 247\r\n1 Foul Orchard (C19) 244\r\n1 Funeral Rites (THB) 97\r\n1 Gaze of Granite (GK1) 61\r\n1 Gemrazer (IKO) 155\r\n1 Glowspore Shaman (GRN) 173\r\n1 Golgari Grave-Troll (DDJ) 60\r\n1 Golgari Rot Farm (C19) 248\r\n1 Grapple with the Past (MYS1) 148\r\n1 Graypelt Refuge (MYS1) 249\r\n1 Grisly Salvage (GK1) 64\r\n1 Guardian Project (RNA) 130\r\n1 Harrow (MYS1) 174\r\n1 Insatiable Hemophage (IKO) 93\r\n1 Jade Mage (C13) 151\r\n1 Jarad's Orders (RTR)\r\n1 Jungle Hollow (IKO) 249\r\n1 Mentor of the Meek (M19) 27\r\n1 Merciless Executioner (FRF) 76\r\n1 Migration Path (IKO) 164\r\n1 Migratory Greathorn (IKO) 165\r\n1 Moldervine Reclamation (M20) 214\r\n1 Necropanther (IKO) 196\r\n1 Nethroi, Apex of Death (IKO) 197\r\n1 Nyx Weaver (JOU) 155\r\n1 Orzhov Basilica (MYS1) 297\r\n1 Path of Discovery (RIX) 142\r\n1 Perpetual Timepiece (KLD) 227\r\n1 Plaguecrafter (C19) 126\r\n3 Plains (IKO) 260\r\n1 Rampant Growth (MYS1) 48\r\n1 Ravenous Chupacabra (MYS1) 104\r\n1 Read the Bones (MYS1) 122\r\n1 Reclamation Sage (C18) 159\r\n1 Sakura-Tribe Elder (MYS1) 187\r\n1 Sandsteppe Citadel (MYS1) 305\r\n1 Satyr Wayfinder (CM1) 143\r\n1 Sawtusk Demolisher (C20) 64\r\n1 Scoured Barrens (IKO) 254\r\n1 Selesnya Sanctuary (C19) 272\r\n1 Shriekmaw (MYS1) 136\r\n1 Soul of the Harvest (EO2) 36\r\n1 Springbloom Druid (MH1) 181\r\n1 Stinkweed Imp (MYS1) 53\r\n1 Stitcher's Supplier (M19) 121\r\n10 Swamp (IKO) 266\r\n1 Syphon Mind (C17) 127\r\n1 Syr Konrad, the Grim (ELD) 107\r\n1 Temple of Malady (M20) 254\r\n1 Terramorphic Expanse (C19) 281\r\n1 Tranquil Expanse (C18) 289\r\n1 Vindictive Vampire (RNA) 90\r\n1 Vizier of Remedies (AKH) 38\r\n1 Winding Way (MH1) 193\r\n1 Yavimaya Granger (ULG)\r\n1 Zulaport Cutthroat (BFZ) 126\r\n\r\n"
txt_deck = "1 Akroma's Memorial\r\n1 Asceticism\r\n1 Avenger of Zendikar\r\n1 Beast Whisperer\r\n1 Beast Within\r\n1 Boseiju, Who Shelters All\r\n1 Castle Garenbrig\r\n1 Collector Ouphe\r\n1 Concordant Crossroads\r\n1 Craterhoof Behemoth\r\n1 Creeping Renaissance\r\n1 Cultivate\r\n1 Defense Grid\r\n1 Defense of the Heart\r\n1 Deserted Temple\r\n1 Dryad Arbor\r\n1 Elvish Mystic\r\n1 Eternal Witness\r\n1 Fabled Passage\r\n1 Finale of Devastation\r\n22 Forest\r\n1 Gaea's Cradle\r\n1 Genesis Wave\r\n1 Green Sun's Zenith\r\n1 Hall of Gemstone\r\n1 Heroic Intervention\r\n1 Kamahl, Fist of Krosa\r\n1 Karametra's Acolyte\r\n1 Karn Liberated\r\n1 Kenrith's Transformation\r\n1 Kogla, the Titan Ape\r\n1 Krosan Grip\r\n1 Llanowar Elves\r\n1 Llanowar Tribe\r\n1 Lotus Cobra\r\n1 Lurking Predators\r\n1 Mana Reflection\r\n1 Miren, the Moaning Well\r\n1 Misty Rainforest\r\n1 Nacatl War-Pride\r\n1 Natural Order\r\n1 Nature's Will\r\n1 Nevinyrral's Disk\r\n1 Nissa's Pilgrimage\r\n1 Nissa, Who Shakes the World\r\n1 Nykthos, Shrine to Nyx\r\n1 Nylea's Intervention\r\n1 Nyxbloom Ancient\r\n1 Ohran Frostfang\r\n1 Oracle of Mul Daya\r\n1 Praetor's Counsel\r\n1 Priest of Titania\r\n1 Questing Beast\r\n1 Regal Force\r\n1 Regrowth\r\n1 Reliquary Tower\r\n1 Return of the Wildspeaker\r\n1 Rings of Brighthearth\r\n1 Rishkar's Expertise\r\n1 Scavenging Ooze\r\n1 Seedborn Muse\r\n1 Selvala's Stampede\r\n1 Selvala, Heart of the Wilds\r\n1 Shamanic Revelation\r\n1 Skyshroud Claim\r\n1 Song of the Dryads\r\n1 Soul of the Harvest\r\n1 Spike Weaver\r\n1 Spore Frog\r\n1 Sylvan Library\r\n1 The Great Henge\r\n1 Verdant Catacombs\r\n1 Vigor\r\n1 Vivien, Monsters' Advocate\r\n1 Vorinclex, Voice of Hunger\r\n1 Windswept Heath\r\n1 Wood Elves\r\n1 Wooded Foothills\r\n1 Woodfall Primus\r\n"

logging.basicConfig(format='%(asctime)s %(message)s', stream=sys.stdout, level=logging.DEBUG)


class MyTestCase(unittest.TestCase):

    def test_deck_parsing(self):
        deck0 = parse_deck(arena_deck)
        deck1 = parse_deck(txt_deck)
        print(deck0)
        print(deck1)
        self.assertEqual(len(deck0), len(deck1))

    def test_load_tokens(self):
        print(MagicTable.get_card_map()[-1])

    def test_load_cards(self):
        print(MagicTable.get_card_map()[0])

    def test_card_map(self):
        resolver = CardResolver(MagicTable.get_card_map())
        print(resolver.find_card('Akroma, Angel of Wrath'))
        print(resolver.find_card('Nissa, Vastwood Seer'))
        # self.assertIn('face_small', card_map['Akroma, Angel of Wrath']['c20'][0])
        # self.assertIn('faces_small', card_map['Nissa, Vastwood Seer']['v17'][0])

    def test_add_player(self):
        player = {'name': 'kerran', 'table': '1',
                  'deck': arena_deck,
                  'color': 'OliveDrab'}
        table = MagicTable(player['table'])
        table.add_player(player)
        print(table.get_data())


if __name__ == '__main__':
    unittest.main()
