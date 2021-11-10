import { FlowContent } from "../structure/FlowContent";
import { FlowRange } from "../selection/FlowRange";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { ParagraphStyle, ParagraphStyleProps } from "../styles/ParagraphStyle";

/** @internal */
export const splitRangeByUniformParagraphStyle = <K extends keyof ParagraphStyleProps>(
    range: FlowRange,
    content: FlowContent,
    ...keys: K[]
): [FlowRange, Partial<Pick<ParagraphStyleProps, K>>][] => {
    const { first, last, isBackward } = range;
    const result: [FlowRange, Partial<Pick<ParagraphStyleProps, K>>][] = [];
    let start = first;
    let uniform: Partial<Pick<ParagraphStyleProps, K>> | null = null;

    const emit = (end: number) => {
        if (!uniform || end < start) {
            return;
        }

        let subrange = FlowRange.at(start, end - start);

        if (isBackward) {
            subrange = subrange.reverse();
        }

        result.push([subrange, uniform]);
        uniform = null;
        start = end;
    };
    
    for (
        let cursor = content.peek(first).findNodeForward(ParagraphBreak.classType.test);
        cursor !== null && cursor.position < last;
        cursor = cursor.moveToStartOfNextNode()?.findNodeForward(ParagraphBreak.classType.test) ?? null
    ) {
        const { node, position } = cursor;
        const { style } = node as ParagraphBreak;

        if (uniform && !isMatchingStyle(uniform, style, keys)) {
            emit(position);
        }

        if (!uniform) {
            uniform = {};
            for (const k of keys) {
                const val = style.get(k);
                if (val !== void(0)) {
                    uniform[k] = val;
                }
            }
        }
    }

    if (uniform) {
        emit(last);
    }

    return result;
};

const isMatchingStyle = <K extends keyof ParagraphStyleProps>(
    uniform: Partial<Pick<ParagraphStyleProps, K>>,
    style: ParagraphStyle,
    keys: K[], 
): boolean => {
    for (const k of keys) {
        const req = uniform[k];

        if (req === void(0)) {
            if (style.has(k)) {
                return false;
            }
        } else if (!style.has(k, req)) {
            return false;
        }
    }
    return true;
};
