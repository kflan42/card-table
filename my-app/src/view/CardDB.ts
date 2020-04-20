
export function randint(m: number) {
    return Math.floor(Math.random() * m);
}

export function randchoice(arr: any[]) {
    return arr[randint(arr.length)];
}

export const testDeck = [
    "Avenger of Zendikar",
    "Azusa, Lost but Seeking",
    "Blackblade Reforged",
    "Breeding Pool",
    "Burgeoning",
    "Command Tower",
    "Consecrated Sphinx",
    "Courser of Kruphix",
    "Crop Rotation",
    "Crucible of Worlds",
    "Damia, Sage of Stone",
    "Dark Depths",
    "Demonic Tutor",
    "Dryad of the Ilysian Grove",
    "Elvish Reclaimer",
    "Evolving Wilds",
    "Exploration",
    "Exsanguinate",
    "Fabled Passage",
    "Field of the Dead",
    "Forest",
    "Genesis Wave",
    "Ghirapur Orrery",
    "Grazing Gladehart",
    "Growth Spiral",
    "Hedron Crab",
    "Hinterland Harbor",
    "Island",
    "Jaddi Offshoot",
    "Jin-Gitaxias, Core Augur",
    "Library of Leng",
    "Manabond",
    "Marit Lage's Slumber",
    "Meloku the Clouded Mirror",
    "Muldrotha, the Gravetide",
    "Multani, Yavimaya's Avatar",
    "Myriad Landscape",
    "Nissa, Vastwood Seer",
    "Nissa, Who Shakes the World",
    "Notion Thief",
    "Nylea's Intervention",
    "Nyxbloom Ancient",
    "Ob Nixilis, the Fallen",
    "Overgrown Tomb",
    "Prismatic Vista",
    "Rampaging Baloths",
    "Ramunap Excavator",
    "Retreat to Coralhelm",
    "Retreat to Hagra",
    "Rhystic Study",
    "Rites of Flourishing",
    "Roil Elemental",
    "Scapeshift",
    "Scheming Symmetry",
    "Skyshroud Claim",
    "Skyshroud Ranger",
    "Snow-Covered Forest",
    "Snow-Covered Island",
    "Snow-Covered Swamp",
    "Sol Ring",
    "Splendid Reclamation",
    "Springbloom Druid",
    "Strip Mine",
    "Swamp",
    "Tatyova, Benthic Druid",
    "Terramorphic Expanse",
    "The Gitrog Monster",
    "Thespian's Stage",
    "Tireless Tracker",
    "Torment of Hailfire",
    "Undergrowth Champion",
    "Villainous Wealth",
    "Vorinclex, Voice of Hunger",
    "Watery Grave",
    "Wayward Swordtooth",
    "Woodland Cemetery",
    "Yarok, the Desecrated",
]

export interface CardData {
    name: string
    set: string
    num: string // can have weird chars
    face?: string
    faces?: { [index: string]: string }
}

class CardDB {

    private static cardMap: Map<string, Array<CardData>>

    private static cards: Promise<CardData[]>

    static buildMap(cds: CardData[]) {
        this.cardMap = new Map()
        for (const cd of cds) {
            if (cd.face) {
                const a = this.cardMap.get(cd.name)
                if (a) {
                    a.push(cd)
                } else {
                    this.cardMap.set(cd.name, new Array(cd))
                }
            } else if (cd.faces) {
                for (const f in cd.faces) {
                    const a = this.cardMap.get(f)
                    if (a) {
                        a.push(cd)
                    } else {
                        this.cardMap.set(f, new Array(cd))
                    }
                }
            } else {
                console.error(`can't map card ${cd.name}  ${cd.set}  ${cd.num}`)
            }
        }
        console.log("card map built")
    }

    static getCardFromMap(name: string) {
        if (!this.cardMap) return undefined;
        // pick random set for a given name
        const a = this.cardMap.get(name)
        if (a) return randchoice(a)
        return undefined; // not found, fall through
    }

    static async loadCards() {
        if (CardDB.cards)
            return CardDB.cards
        else {
            console.log("beginning load")
            CardDB.cards = fetch('my-cards.json').then(r => { return r.json() })
            CardDB.cards.then((cds) => {
                console.log(`${cds.length} cards loaded`)
                CardDB.buildMap(cds);
            });
            return CardDB.cards
        }
    }

    static async getCard(name: string): Promise<CardData> {
        // fast path
        const c = CardDB.getCardFromMap(name)
        if (c) return c;
        // trigger first load
        const cards = await this.loadCards()
        // fast path
        const c2 = CardDB.getCardFromMap(name)
        if (c2) return c2;

        for (const cd of cards) {
            if (cd.name === name) {
                return cd;
            } else if (cd.faces) {
                for (const face in cd.faces) {
                    if (face === name) {
                        return cd;
                    }
                }
            }
        }
        throw Error(`no CardData found for ${name}`)
    }

}

export default CardDB
