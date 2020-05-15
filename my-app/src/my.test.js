import {parseDeckCard} from "./CardDB";


test('card parsing test', () => {
    expect(
        parseDeckCard("1x Zombie (AKH)")
    ).toEqual(
        {count: 1, name: 'Zombie', set_name: 'AKH', number: undefined}
    )

    expect(
        parseDeckCard("Elf Druid")
    ).toEqual(
        {count: 1, name: 'Elf Druid', set_name: undefined, number: undefined}
    )
})