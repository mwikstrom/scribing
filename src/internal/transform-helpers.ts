import { FlowRange } from "../FlowRange";

/** @internal */
export interface FlowRangeOperation {
    readonly range: FlowRange;
    set(key: "range", value: FlowRange): this;
}

/** @internal */
export const transformRangeOpAfterInsertion = <T extends FlowRangeOperation>(
    op: T,
    other: FlowRange,
): T | null => coreTransformRangeOpAfterInsertion(op, other, false);

/** @internal */
export const transformEdgeInflatingRangeOpAfterInsertion = <T extends FlowRangeOperation>(
    op: T,
    other: FlowRange,
): T | null => coreTransformRangeOpAfterInsertion(op, other, true);

const coreTransformRangeOpAfterInsertion = <T extends FlowRangeOperation>(
    op: T,
    other: FlowRange,
    edgeInflating: boolean,
): T | null => {
    const target = transformRangeAfterInsertion(op.range, other, edgeInflating);
    return op.set("range", target);
};

/** @internal */
export const transformRangeOpAfterRemoval = <T extends FlowRangeOperation>(
    op: T,
    other: FlowRange,
): T | null => {
    const target = transformRangeAfterRemoval(op.range, other);
    if (target === null) {
        return null;
    }
    return op.set("range", target);
};

/** @internal */
export const transformRangeAfterInsertion = (
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
export const transformRangeAfterRemoval = (
    target: FlowRange,
    removed: FlowRange,
    allowCollapse = false,
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
        if (target.isCollapsed && !allowCollapse) {
            return null;
        }
    }       

    // Translated when removal was made before start
    if (removed.first < target.first) {
        target = target.translate(intersection.size - removed.size);
    }

    return target;
};
