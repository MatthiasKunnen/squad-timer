/**
 * Shuffle an array in place using the Fisher-Yates algorithm.
 * @param array The array to be shuffled in place.
 * @param stopAfter When only interested in shuffling the last x items, pass
 * this parameter.
 */
export function shuffle<T>(array: Array<T>, stopAfter = Number.MAX_SAFE_INTEGER): Array<T> {
    let i = array.length;
    let remaining = stopAfter;

    while (i > 1 && remaining-- > 0) {
        const r = Math.floor(Math.random() * i--);
        [array[i], array[r]] = [array[r], array[i]];
    }

    return array;
}
