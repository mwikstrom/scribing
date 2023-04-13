import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { FlowNode } from "../nodes/FlowNode";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { StartMarkup } from "../nodes/StartMarkup";
import { FlowCursor } from "../selection/FlowCursor";
import { FlowRange } from "../selection/FlowRange";
import { AsyncFlowNodeVisitor } from "../structure/AsyncFlowNodeVisitor";
import { FlowContent } from "../structure/FlowContent";

/**
 * @public
 */
export type MarkupHandler<T = never> = (input: MarkupHandlerInput<T>) => Promise<FlowContent | T | null | undefined>;

/**
 * @public
 */
export interface MarkupHandlerInput<T = unknown> extends MarkupProcessingScope {
    readonly content: FlowContent | null;
    readonly handler: MarkupHandler<T>;
    readonly register: MarkupReplacementRegistration<T>;
}

/**
 * @public
 */
export interface MarkupProcessingScope {
    readonly node: StartMarkup | EmptyMarkup;
    readonly parent: MarkupProcessingScope | null;
    readonly siblingsBefore: readonly (StartMarkup | EmptyMarkup)[];
}

/**
 * @public
 */
export type MarkupReplacementRegistration<T> = (
    placeholder: EmptyMarkup,
    replacement: T,
    input: MarkupHandlerInput<T>
) => void;

/**
 * @public
 */
export function processNestedMarkup<T>(
    input: MarkupHandlerInput<T>,
    content?: FlowContent,
): Promise<FlowContent> {
    const { content: defaultContent, handler, register, ...scope } = input;
    return processMarkup(content || defaultContent || FlowContent.empty, handler, register, scope);
}

/**
 * @public
 */
export async function processMarkup<T>(
    content: FlowContent,
    handler: MarkupHandler<T>,
    register: MarkupReplacementRegistration<T>,
    scope: MarkupProcessingScope | null = null,
) : Promise<FlowContent> {
    const output: FlowNode[] = [];
    await renderMarkup(content, handler, register, scope, output, "empty");
    return FlowContent.fromData(output);
}

type ParagraphMode = "empty" | "not-empty" | "omit";

const renderMarkup = async <T>(
    input: FlowContent,
    handler: MarkupHandler<T>,
    register: MarkupReplacementRegistration<T>,
    parent: MarkupProcessingScope | null,
    output: FlowNode[],
    mode: ParagraphMode,
): Promise<ParagraphMode> => {
    let siblingsBefore: readonly (StartMarkup | EmptyMarkup)[] = Object.freeze([]);
    for (
        let cursor: FlowCursor | null = input.peek(0);
        cursor != null;
        cursor = cursor.moveToStartOfNextNode()
    ) {
        const { node } = cursor;
        if (node instanceof StartMarkup) {
            const end = cursor.findMarkupEnd();
            if (end === null) {
                output.push(node);
            } else {
                const start = cursor.position + node.size;
                const distance = end.position - start;
                const content = input.copy(FlowRange.at(start, distance));
                mode = await renderMarkupNode(output, mode, handler, register, node, parent, siblingsBefore, content);
                siblingsBefore = Object.freeze([...siblingsBefore, node]);
                cursor = end;
            }
        } else if (node instanceof EmptyMarkup) {
            mode = await renderMarkupNode(output, mode, handler, register, node, parent, siblingsBefore);
            siblingsBefore = Object.freeze([...siblingsBefore, node]);
        } else if (node instanceof ParagraphBreak) {
            if (mode !== "omit") {
                output.push(node);
            }
            mode = "empty";
        } else if (node !== null) {
            output.push(await new MarkupProcessor(handler, register, parent).visitNode(node));
            mode = "not-empty";
        }
    }
    return mode;
};

class MarkupProcessor<T> extends AsyncFlowNodeVisitor {
    readonly #handler: MarkupHandler<T>;
    readonly #register: MarkupReplacementRegistration<T>;
    readonly #parent: MarkupProcessingScope | null;

    constructor(
        handler: MarkupHandler<T>,
        register: MarkupReplacementRegistration<T>,
        parent: MarkupProcessingScope | null,
    ) {
        super();
        this.#handler = handler;
        this.#register = register;
        this.#parent = parent;
    }

    override visitFlowContent(content: FlowContent): Promise<FlowContent> {
        return processMarkup(content, this.#handler, this.#register, this.#parent);
    }
}

const renderMarkupNode = async <T>(
    output: FlowNode[],
    mode: ParagraphMode,
    handler: MarkupHandler<T>,
    register: MarkupReplacementRegistration<T>,
    node: StartMarkup | EmptyMarkup,
    parent: MarkupProcessingScope | null,
    siblingsBefore: readonly (StartMarkup | EmptyMarkup)[],
    content: FlowContent | null = null,
): Promise<ParagraphMode> => {
    const input: MarkupHandlerInput<T> = Object.freeze({
        parent,
        node,
        siblingsBefore,
        content,
        handler,
        register,
    });

    let result = await handler(input);
    
    if (result === undefined) {
        result = content;
    }
    
    if (result instanceof FlowContent) {
        mode = await renderMarkup(result, handler, register, input, output, mode);
    } else if (result !== null) {
        const placeholder = new EmptyMarkup(node).set("tag", `REPLACEMENT_${node.tag}`);
        register(placeholder, result, input);
        output.push(placeholder);
        return "not-empty";
    }

    return mode === "empty" ? "omit" : mode;
};
