export function randint(m: number) {
    return Math.floor(Math.random() * m);
}

export function randchoice(arr: any[]) {
    return arr[randint(arr.length)];
}

/** used in reducer, so must be deterministic */
export function shuffleArray(array: any[], seed: number) {
    function mulberry32(a: number) {
        return function () {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
    }

    const random = mulberry32(seed)
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/** safe for url path, local directory path, bucket path */
export function safeString(s: string) {
    return s.replace(/[^A-Za-z0-9-_]/, '')
}