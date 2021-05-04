/**
 * Remove all keys from an object where the value is undefined.
 */
export function removeUndefined(object: any): any {
    Object.entries(object).forEach(([key, value]: [any, any]) => {
        if (value === undefined) {
            delete object[key];
        }
    });
}
