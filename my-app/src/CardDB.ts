// image caching seems good, with most hitting memory or disk cache when refreshing a game with same cards

import {SFCard} from "./magic_models";
import {randchoice} from "./Utilities";

class CardDB {

    private static cardMap: { [index: string]: SFCard }

    private static cards: Promise<SFCard[]>

    static buildMap(cds: SFCard[]) {
        this.cardMap = {}
        for (const cd of cds) {
            this.cardMap[cd.sf_id] = cd
        }
        console.log("card map built")
    }

    static async loadCards(url: string) {
        if (CardDB.cards)
            return CardDB.cards
        else {
            console.log("beginning load from " + url)
            CardDB.cards = fetch(url).then(r => {
                return r.json()
            })
            CardDB.cards.then((cds) => {
                console.log(`${cds.length} cards loaded`)
                CardDB.buildMap(cds);
            });
            return CardDB.cards
        }
    }

    static getCard(sf_id: string): SFCard {
        // fast path
        const c = CardDB.cardMap[sf_id]
        if (c) return c as SFCard
        console.warn(`CardDB card not found for ${sf_id}`)
        throw Error(`CardDB card not found for ${sf_id}`)
    }

    static findCardNow(name: string, set_name?:string, number?:string) {
        const choices = Object.values(this.cardMap).filter(card => {
            return card.name.toLowerCase() === name.toLowerCase()
                && (set_name === undefined || card.set_name === set_name.toLowerCase())
                && (number === undefined || card.number === number.toLowerCase())
        })
        if (choices) {
            return randchoice(choices)
        }
        throw Error(`CardDB card not found for ${name}`)
    }

    private static tokens: string[] = []

    static getTokenChoices() {
        if(this.tokens.length === 0) {
            this.tokens = Object.values(this.cardMap)
                .filter(c => c.set_name.length === 4)
                .map(c => `${c.name} (${c.set_name.toUpperCase()}) ${c.number}`)
                .sort()
        }
        return this.tokens
    }
}

export default CardDB

export function parseDeckCard(deckCard: string) {
    let cardParts = deckCard.split(" ")
    let first = cardParts[0].replace("x", "");
    let count = 1
    if (first.match(/\d+/)) {
        count = Number.parseInt(first)
        cardParts = cardParts.slice(1)
    }
    var set_name = undefined, number = undefined;
    if (cardParts.length > 2) { // count "name" (set) num // plus spaces in name
        const m = cardParts[cardParts.length - 2].match(/\((\w+)\)/);
        if (m) {
            set_name = m[1];
            number = cardParts[cardParts.length - 1]; // not always numeric
        }
    }
    if (cardParts.length > 1) { // count "name" (set) // plus spaces in name
        const m = cardParts[cardParts.length - 1].match(/\((\w+)\)/);
        if (m) {
            set_name = m[1];
            // no set number if set last
        }
    }
    // else just count "name" // plus spaces in name
    const nameParts = cardParts.length - (set_name ? 1 : 0) - (number ? 1 : 0)
    const name = cardParts.slice(0, nameParts).join(" ")
    return {count, name, set_name, number}
}