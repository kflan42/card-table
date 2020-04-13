import gameReducer from "./Reducers";
import { toggleTap } from './Actions'

test('should handle tapping', () => {
    const input = { cards: { 1: { id: 1, tapped: false } } }
    console.log(input)
    expect(
        gameReducer(input, toggleTap(1))
    ).toEqual(
        { cards: { 1: { id: 1, tapped: true } } }
    )
}
)
