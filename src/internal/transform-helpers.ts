import { FlowRange } from "../selection/FlowRange";

/** @internal */
export interface FlowRangeOperation {
    readonly range: FlowRange;
    set(key: "range", value: FlowRange): this;
}

/** @internal */
export const transformRangeOpAfterInsertFlow = <T extends FlowRangeOperation>(
    op: T,
    other: FlowRange,
): T | null => coreTransformRangeOpAfterInsertFlow(op, other, false);

/** @internal */
export const transformEdgeInflatingRangeOpAfterInsertFlow = <T extends FlowRangeOperation>(
    op: T,
    other: FlowRange,
): T | null => coreTransformRangeOpAfterInsertFlow(op, other, true);

const coreTransformRangeOpAfterInsertFlow = <T extends FlowRangeOperation>(
    op: T,
    other: FlowRange,
    edgeInflating: boolean,
): T | null => {
    const target = getRangeAfterInsertion(op.range, other, edgeInflating);
    return op.set("range", target);
};

/** @internal */
export const transformRangeOpAfterRemoveFlow = <T extends FlowRangeOperation>(
    op: T,
    other: FlowRange,
): T | null => {
    const target = getRangeAfterRemoval(op.range, other);
    if (target === null) {
        return null;
    }
    return op.set("range", target);
};

/** @internal */
export const getRangeAfterInsertion = (
    target: FlowRange,
    inserted: FlowRange,
    inflateAtTargetEdges = false,
): FlowRange => {
    // Translated when insertion was made before or at start
    const translate = inflateAtTargetEdges ? inserted.first < target.first : inserted.first <= target.first;
    if (translate) {
        return target.translate(inserted.size);
    }

    // Inflated when insertion was made inside
    const inflate = inflateAtTargetEdges ? inserted.first <= target.last : inserted.first < target.last;
    if (inflate) {
        return target.inflate(inserted.size);
    }
    
    // Otherwise, unaffected
    return target;
};

/** @internal */
export const getRangeAfterRemoval = (
    target: FlowRange,
    removed: FlowRange,
    keepCollapsed = false,
): FlowRange | null => {
    // Unaffected when removal was made at or after end
    if (removed.first >= target.last) {
        return target;
    }

    // Deflated when removal insersect with this
    const intersection = target.intersect(removed); 
    if (intersection.size > 0) {
        target = target.deflate(intersection.size);

        // Cancelled when deflated to nothing
        if (target.isCollapsed && !keepCollapsed) {
            return null;
        }
    }       

    // Translated when removal was made before start
    if (removed.first < target.first) {
        target = target.translate(intersection.size - removed.size);
    }

    return target;
};

/** @internal */
export const insertionAfterInsertion = <T, K extends string>(
    op: T & Record<K | "count", number> & { set(key: K | "count", value: number): T },
    key: K,
    index: number,
    count: number,
): T => {
    if (index > op[key]) {
        // other insertion was made after our position
        return op;
    } else {
        // other insertion was made at or before our position
        return op.set(key, op[key] + count);
    }
};

/** @internal */
export const insertionAfterRemoval = <T, K extends string>(
    op: T & Record<K | "count", number> & { set(key: K | "count", value: number): T },
    key: K,
    index: number,
    count: number,
): T | null => {
    if (index > op[key]) {
        // other removal was made after our position
        return op;
    } else if (index + count <= op[key]) {
        // other removal was made before out position
        return op.set(key, op[key] - count);
    } else {
        // other removal cover our insertion point
        return null;
    }
};

/** @internal */
export const removalAfterInsertion = <T, K extends string>(
    op: T & Record<K | "count", number> & { set(key: K | "count", value: number): T },
    key: K,
    index: number,
    count: number,
): T => {
    if (index <= op[key]) {
        // other insertion before our position
        return op.set(key, op[key] + count);
    } else if (index >= op[key] + op.count) {
        // other insertion after our removed range
        return op;
    } else {         
        // other insertion inside our removed range  
        return op.set("count", op.count + count);
    }
};

/** @internal */
export const removalAfterRemoval = <T extends { set(key: K | "count", value: number): T }, K extends string>(
    op: T & Record<K | "count", number>,
    key: K,
    index: number,
    count: number,
): T | null => {
    if (index >= op[key] + op.count) {
        // other removal after our removed range
        return op;
    } else if (index + count < op[key]) {
        // other removal before our the start or our remval
        return op.set(key, op.count - count);
    } else if (index <= op[key] && index + count >= op[key] + op.count) {
        // other removal covers our removal
        return null;
    } else if (index <= op[key] && index + count < op[key] + op.count) {
        // other removal overlap the start of our removal
        const delta = index + count - op[key];
        return op.set("count", op.count - delta).set(key, op[key] + delta);
    } else {
        // other removal overlap the end of our removal
        // -or-
        // other removal is inside out removal
        const delta = Math.min(count, op[key] + op.count - index);
        return op.set("count", op.count - delta);
    }
};
