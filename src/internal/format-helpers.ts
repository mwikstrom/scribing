import { RecordObject } from "paratype";
import { FlowBatch } from "../operations/FlowBatch";
import { FlowContent } from "../structure/FlowContent";
import { FlowNode } from "../nodes/FlowNode";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowRange } from "../selection/FlowRange";

/** @internal */
export interface FormatOpProps<S> {
    range: FlowRange,
    style: S,
}

/** @internal */
export interface InvertFormatOptions<S extends RecordObject<T>, T> {
    content: FlowContent;
    range: FlowRange;
    style: S;
    getStyle: (node: FlowNode) => S | null;
    makeStyle: (props: T) => S;
    makeFormatOp: (props: FormatOpProps<S>) => FlowOperation;
    makeUnformatOp: (props: FormatOpProps<S>) => FlowOperation;
}

/** @internal */
export const invertFormatOp = <S extends RecordObject<T>, T>(
    options: InvertFormatOptions<S, T>
): FlowOperation | null => coreInvertFormatOp(options);

/** @internal */
export const invertUnformatOp = <S extends RecordObject<T>, T>(
    options: Omit<InvertFormatOptions<S, T>, "makeUnformatOp">
): FlowOperation | null => coreInvertFormatOp(options);

const coreInvertFormatOp = <S extends RecordObject<T>, T>(
    options: (
        Omit<InvertFormatOptions<S, T>, "makeUnformatOp"> & 
        Partial<Pick<InvertFormatOptions<S, T>, "makeUnformatOp">>
    )
): FlowOperation | null => {
    const { content, range, style, getStyle, makeStyle, makeFormatOp, makeUnformatOp } = options;
    let position = range.first;
    const operations: FlowOperation[] = [];

    if (makeUnformatOp) {
        operations.push(makeUnformatOp({range, style}));
    }

    for (const node of content.peek(position).range(range.size)) {
        const nodeStyle = getStyle(node);

        if (nodeStyle !== null) {
            const restore = new Map();

            for (const key of style.assigned) {
                const nodeValue = nodeStyle.get(key);
                if (nodeValue !== void(0)) {
                    restore.set(key, nodeValue);
                }
            }

            if (restore.size > 0) {
                operations.push(makeFormatOp({
                    range: FlowRange.at(position, node.size),
                    style: makeStyle(Object.fromEntries(restore)),
                }));
            }
        }

        position += node.size;
    }

    return FlowBatch.fromArray(operations);
};
