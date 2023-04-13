import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { FlowNode } from "../nodes/FlowNode";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { StartMarkup } from "../nodes/StartMarkup";
import { FlowCursor } from "../selection/FlowCursor";
import { FlowRange } from "../selection/FlowRange";
import { FlowContent } from "../structure/FlowContent";
import { Script } from "../structure/Script";
import { MarkupHandlerInput } from "./process-markup";

/** @public */
export function extractMarkup<T>(
    input: MarkupHandlerInput<T>,
    predicate: string | RegExp | ((tag: string, attr: ReadonlyMap<string, string | Script>) => boolean)
): [FlowContent, ...MarkupHandlerInput<T>[]] {
    if (typeof predicate === "string") {
        const needle = predicate;
        predicate = (tag: string) => tag === needle;
    } else if (predicate instanceof RegExp) {
        const pattern = predicate;
        predicate = (tag: string) => pattern.test(tag);
    }

    const { content, handler, register, ...parent } = input;
    const remainder: FlowNode[] = [];
    const extracted: MarkupHandlerInput<T>[] = [];
    const siblingsBefore: (EmptyMarkup | StartMarkup)[] = [];

    const pushNext = (node: EmptyMarkup | StartMarkup, content: FlowContent | null) => {
        const next: MarkupHandlerInput<T> = {
            node,
            content,  
            siblingsBefore: Object.freeze([...siblingsBefore]),
            parent,
            handler,
            register
        };
        extracted.push(next);
        siblingsBefore.push(node);
    };

    if (content) {
        let omitNextParaBreak = false;
        for (
            let cursor: FlowCursor | null = content.peek(0);
            cursor !== null;
            cursor = cursor.moveToStartOfNextNode()
        ) {
            const { node } = cursor;

            if (node instanceof EmptyMarkup && predicate(node.tag, node.attr)) {
                pushNext(node, null);
                omitNextParaBreak = true;
                continue;
            }

            if (node instanceof StartMarkup) {
                const end = cursor.findMarkupEnd();
                if (end && predicate(node.tag, node.attr)) {
                    const start = cursor.position + node.size;
                    const distance = end.position - start;
                    const clone = content.copy(FlowRange.at(start, distance));
                    pushNext(node, clone);
                    cursor = end;
                    omitNextParaBreak = true;
                    continue;
                }
            }

            if (node instanceof ParagraphBreak && omitNextParaBreak) {
                omitNextParaBreak = false;
                continue;
            }

            if (node) {
                remainder.push(node);
                omitNextParaBreak = false;
            }
        }
    }

    return [content || FlowContent.empty, ...extracted];
}
