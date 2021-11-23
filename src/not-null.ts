/**
 * Applies the specified callback on every element in the specified array and
 * returns the resulting elements that are not `null` nor `undefined`.
 * @public
 */
export const mapNotNull = <A extends readonly unknown[], T>(
    array: A,
    callback: (value: A[number], index: number) => (T | null | undefined),
): NotNull<T>[] => filterNotNull(array.map(callback));

/**
 * Returns elements from the specified array that are not `null` nor `undefined`
 * @public
 */
export const filterNotNull = <T>(
    array: readonly T[]
): NotNull<T>[] => array.filter(value => value !== null && value !== void(0)) as NotNull<T>[];

/**
 * Excludes `null` and `undefined` from the specified type
 * @public
 */
export type NotNull<T> = Exclude<T, null | undefined>;
