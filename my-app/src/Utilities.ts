export function randint(m: number) {
    return Math.floor(Math.random() * m);
}

export function randchoice(arr: any[]) {
    return arr[randint(arr.length)];
}

export function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}