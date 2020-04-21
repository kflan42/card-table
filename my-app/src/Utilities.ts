export function randint(m: number) {
    return Math.floor(Math.random() * m);
}

export function randchoice(arr: any[]) {
    return arr[randint(arr.length)];
}