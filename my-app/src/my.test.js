import todoApp from "./Reducers";
import { tapCard } from './Actions'

test('should handle tapping', () => {
    const input = { cardsById: { 1: { id: 1, tapped: false } } }
    console.log(input)
    expect(
        todoApp(input, tapCard(1))
    ).toEqual(
        { cardsById: { 1: { id: 1, tapped: true } } }
    )
}
)
