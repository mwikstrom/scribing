/** @internal */
export const mapNotNull = <T>(
    array: readonly T[],
    callback: (value: T, index: number, array: readonly T[]) => (T | null | undefined),
): NotNullish<T>[] => array.map(callback).filter(value => value !== null && value !== void(0)) as NotNullish<T>[];

/** @internal */
export const filterNotNull = <T>(
    array: readonly T[]
): NotNullish<T>[] => array.filter(value => value !== null && value !== void(0)) as NotNullish<T>[];

/** @internal */
export type NotNullish<T> = Exclude<T, null | undefined>;
