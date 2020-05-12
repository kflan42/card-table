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

    static async loadCards(gameId: string) {
        if (CardDB.cards)
            return CardDB.cards
        else {
            const url = gameId === 'test' ? 'testCards.json' : 'http://localhost:3000/table/' + gameId + '/cards'
            console.log("beginning load from " + url)
            // TODO load only necessary cards from server, this 2MB file is slow. split cards vs tokens.
            // re-run lighthouse with prod server, dev one has huge dev js piles of files, my code negligible
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

    static findCardNow(name: string) {
        const choices = Object.values(this.cardMap).filter(card => card.name === name)
        if (choices) {
            return randchoice(choices)
        }
        throw Error(`CardDB card not found for ${name}`)
    }
}

export default CardDB
