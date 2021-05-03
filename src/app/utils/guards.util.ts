export type NotNull<T> = T extends null ? never : T;
export type NotUndefined<T> = T extends undefined ? never : T;
export type NotNullOrUndefined<T> = NotNull<NotUndefined<T>>;

export function isNotNull<T>(input: T): input is NotNull<T> {
    return input !== null;
}

export function isNotUndefined<T>(value: T): value is NotUndefined<T> {
    return value !== undefined;
}

export function isNotNullOrUndefined<T>(value: T): value is NotNullOrUndefined<T> {
    return value != null;
}

export function isEmpty(value: any): value is '' | null | undefined {
    return value == null || value === '';
}
