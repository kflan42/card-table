import { randchoice } from "./Utilities"

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

    static getCardFromMap(name: string, set?: string, num?: string) {
        if (!this.cardMap) return undefined;
        // pick random set for a given name
        const variants = this.cardMap.get(name)
        if (variants) {
            if (set) {
                const setVariants = variants.filter(c => c.set === set)
                if (num) {
                    const setNumVariants = setVariants.filter(c => c.num === num)
                    if (setNumVariants.length > 0)
                        return randchoice(setNumVariants)
                }
                if (setVariants.length > 0)
                    return randchoice(setVariants)
            }
            return randchoice(variants) // todo, do this once on deck load, not every card render!
        }
        return undefined; // not found, fall through
    }

    static async loadCards() {
        if (CardDB.cards)
            return CardDB.cards
        else {
            console.log("beginning load")
            // todo load only necessary cards from server, this 2MB file is slow
            // todo tho need to pray image caching is good, 50 images was 9MB, tho that's with 60 cards on the field
            // todo re-run lighthouse with prod server, dev one has huge dev js piles of files, my code negligible
            CardDB.cards = fetch('my-cards.json').then(r => { return r.json() })
            CardDB.cards.then((cds) => {
                console.log(`${cds.length} cards loaded`)
                CardDB.buildMap(cds);
            });
            return CardDB.cards
        }
    }

    static async getCard(name: string, set?: string, num?: string): Promise<CardData> {
        // fast path
        const c = CardDB.getCardFromMap(name, set, num)
        if (c) return c;
        // trigger first load
        await this.loadCards()
        // fast path
        const c2 = CardDB.getCardFromMap(name)
        if (c2) return c2;
        throw Error(`no CardData found for ${name}`)
    }

}

export default CardDB
