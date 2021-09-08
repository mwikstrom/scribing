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
    const { range } = op;

    // Translated when insertion was made before or at start
    const translate = edgeInflating ? other.first < range.first : other.first <= range.first;
    if (translate) {
        return op.set("range", range.translate(other.size));
    }

    // Inflated when insertion was made inside
    const inflate = edgeInflating ? other.first <= range.last : other.first < range.last;
    if (inflate) {
        return op.set("range", range.inflate(other.size));
    }
    
    // Otherwise, unaffected
    return op;
};

/** @internal */
export const transformRangeOpAfterRemoval = <T extends FlowRangeOperation>(
    op: T,
    other: FlowRange,
): T | null => {
    let { range } = op;

    // Unaffected when removal was made at or after end
    if (other.first >= range.last) {
        return op;
    }

    // Deflated when removal insersect with this
    const intersection = range.intersect(other); 
    if (intersection.size > 0) {
        range = range.deflate(intersection.size);

        // Cancelled when deflated to nothing
        if (range.isCollapsed) {
            return null;
        }
    }       

    // Translated when removal was made before start
    if (other.first < range.first) {
        range = range.translate(intersection.size - other.size);
    }

    return op.set("range", range);
};
