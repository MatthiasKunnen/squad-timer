/**
 * Object.assign but typed stricter.
 * @param target
 * @param sources
 */
export function assignStrict<T extends Record<string, any>>(
    target: T,
    ...sources: Array<Partial<T>>
): T {
    return Object.assign(target, ...sources);
}
