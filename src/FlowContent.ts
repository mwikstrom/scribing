import { 
    arrayType, 
    frozen, 
    JsonValue, 
    jsonValueType, 
    lazyType, 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating, 
} from "paratype";
import { FlowCursor } from "./FlowCursor";
import { FlowNode } from "./FlowNode";
import { FlowRange } from "./FlowRange";
import { FlowTheme } from "./FlowTheme";
import { FlowNodeRegistry } from "./internal/class-registry";
import { ParagraphBreak } from "./ParagraphBreak";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextRun } from "./TextRun";
import { TextStyle } from "./TextStyle";

const NodeArrayType = arrayType(lazyType(FlowNodeRegistry.close));
const RestrictedNodeArrayType = NodeArrayType
    .frozen()
    .restrict(
        "Flow content cannot contain empty text runs or adjacent text runs that should be merged",
        value => !value.some((node, index) => (
            TextRun.classType.test(node) &&
            (
                node.size === 0 ||
                (
                    index > 0 &&
                    TextRun.classType.test(value[index - 1]) &&
                    TextRun.shouldMerge(value[index - 1] as TextRun, node)
                )
            )
        )),
    );
const Props = { nodes: RestrictedNodeArrayType };
const PropsType: RecordType<FlowContentProps> = recordType(Props);
const propsToData = ({nodes}: FlowContentProps): FlowContentData => nodes;
const EMPTY_PROPS: FlowContentProps = Object.freeze({ nodes: Object.freeze([]) });

/**
 * The base record class for {@link FlowContent}
 * @public
 */
export const FlowContentBase = RecordClass(PropsType, Object, NodeArrayType, propsToData);

/**
 * Flow content properties
 * @public
 */
export interface FlowContentProps {
    /** Array of nodes */
    nodes: readonly FlowNode[];
}

/**
 * Flow content data is an array of {@link FlowNode|nodes}
 * @public
 */
export type FlowContentData = readonly FlowNode[];

/**
 * Flow content
 * @public
 * @sealed
 */
@frozen
@validating
export class FlowContent extends FlowContentBase implements Readonly<FlowContentProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowContent);

    /** Gets flow content from the specified data */
    public static fromData(@type(NodeArrayType) data: FlowContentData): FlowContent {
        const props: FlowContentProps = { nodes: Object.freeze(Array.from(FlowContent.merge(data))) };
        return new FlowContent(props);
    }

    /** Gets flow content from the specified JSON value */
    public static fromJsonValue(@type(jsonValueType) value: JsonValue): FlowContent {
        return FlowContent.classType.fromJsonValue(value);
    }

    #size: number | undefined;

    constructor(props: FlowContentProps = EMPTY_PROPS) {
        super(props);
    }

    /**
     * Flow content size
     * @remarks
     * The size of flow content is measured in UTF-16 characters and all nodes,
     * except {@link TextRun|text runs}, are defined to have size 1.
     */
    get size(): number {
        if (this.#size === void(0)) {
            this.#size = this.nodes.reduce((accum, curr) => accum + curr.size, 0);
        }
        return this.#size;
    }

    /**
     * Appends the specified nodes
     * @param nodes - The nodes to be appended
     * @returns The updated flow content
     */
    append(...nodes: readonly FlowNode[]): FlowContent;
    
    /**
     * Appends the specified nodes
     * @param theme - Theme of the current content
     * @param nodes - The nodes to be appended
     * @returns The updated flow content
     */
    append(theme: FlowTheme | undefined, ...nodes: readonly FlowNode[]): FlowContent;
    
    append(first: FlowTheme | FlowNode | undefined, ...rest: readonly FlowNode[]): FlowContent {
        return this.#insert(this.size, first, ...rest);
    }

    /**
     * Extracts a range of flow content
     * @param range - The range to be extracted
     */
    copy(@type(FlowRange.classType) range: FlowRange): FlowContent {
        const cursor = this.peek(range.first);
        return this.set("nodes", Object.freeze(Array.from(cursor.range(range.size))));
    }

    /**
     * Applies paragraph style to a range
     * 
     * @param range - The range to format
     * @param style - The style to apply
     * @returns The updated flow content
     */
    formatParagraph(
        @type(FlowRange.classType) range: FlowRange, 
        @type(ParagraphStyle.classType) style: ParagraphStyle,
            theme?: FlowTheme,
    ): FlowContent {
        // TODO: Verify theme arg
        return this.set("nodes", this.#formatRange(range, node => node.formatParagraph(style), theme));
    }

    /**
     * Applies text style to a range
     * @param range - The range to format
     * @param style - The style to apply
     * @returns The updated flow content
     */
    formatText(
        @type(FlowRange.classType) range: FlowRange,
        @type(TextStyle.classType) style: TextStyle,
            theme?: FlowTheme,
    ): FlowContent {
        // TODO: Verify theme arg
        return this.set("nodes", this.#formatRange(range, node => node.formatText(style), theme));
    }

    /**
     * Inserts the specified nodes at the specified position
     * @param position - The position at which nodes shall be inserted
     * @param nodes - The nodes to be inserted
     * @returns The updated flow content
     */
    insert(position: number, ...nodes: readonly FlowNode[]): FlowContent;

    /**
     * Inserts the specified nodes at the specified position
     * @param position - The position at which nodes shall be inserted
     * @param theme - Theme of the current content
     * @param nodes - The nodes to be inserted
     * @returns The updated flow content
     */
    insert(position: number, theme: FlowTheme | undefined, ...nodes: readonly FlowNode[]): FlowContent;
    
    insert(position: number, first: FlowTheme | FlowNode | undefined, ...rest: readonly FlowNode[]): FlowContent {
        return this.#insert(position, first, ...rest);
    }

    /**
     * Gets a cursor
     * @param position - Optionally specifies the cursor's position. Default is zero.
     */
    peek(@type(nonNegativeIntegerType) position = 0): FlowCursor {
        return new FlowCursor(this).move(position);
    }

    /**
     * Removes a range of flow content
     * @param range - The range to be removed
     * @returns The updated flow content
     */
    remove(@type(FlowRange.classType) range: FlowRange): FlowContent {
        const { before } = this.peek(range.first);
        const { after } = this.peek(range.last);
        const merged = Object.freeze(Array.from(FlowContent.merge(before, after)));
        return this.set("nodes", merged);
    }

    /** Gets a JSON value representation of the current content */
    toJsonValue(): JsonValue {
        return FlowContent.classType.toJsonValue(this);
    }
    
    /**
     * Unapplies paragraph style to a range
     * 
     * @param range - The range to format
     * @param style - The style to unapply
     * @returns The updated flow content
     */
    unformatParagraph(
        @type(FlowRange.classType) range: FlowRange, 
        @type(ParagraphStyle.classType) style: ParagraphStyle
    ): FlowContent {
        return this.set("nodes", this.#formatRange(range, node => node.unformatParagraph(style)));
    }

    /**
     * Unapplies text style to a range
     * @param range - The range to format
     * @param style - The style to unapply
     * @returns The updated flow content
     */
    unformatText(
        @type(FlowRange.classType) range: FlowRange,
        @type(TextStyle.classType) style: TextStyle
    ): FlowContent {
        return this.set("nodes", this.#formatRange(range, node => node.unformatText(style)));
    }
    
    #formatRange(range: FlowRange, formatter: (node: FlowNode) => FlowNode, theme?: FlowTheme): readonly FlowNode[] {
        const first = this.peek(range.first);
        const before = first.before;
        const formatted = Array.from(first.range(range.size)).map(formatter);
        const after = first.move(range.size).after;
        const merged = Array.from(FlowContent.merge(before, formatted, after));
        const unformatted = theme ? FlowContent.unformatAmbient(merged, theme) : merged;
        return Object.freeze(unformatted);
    }

    #insert(position: number, first: FlowTheme | FlowNode | undefined, ...rest: readonly FlowNode[]): FlowContent {
        const { before, after } = this.peek(position);
        const theme = first instanceof FlowTheme ? first : undefined;
        const nodes = [...rest];
        if (first instanceof FlowNode) {
            nodes.unshift(first);
        }
        const merged = Array.from(FlowContent.merge(before, nodes, after));
        const unformatted = theme ? FlowContent.unformatAmbient(merged, theme) : merged;
        return this.set("nodes", Object.freeze(unformatted));
    }

    /** @internal */
    private static *merge(...args: readonly Iterable<FlowNode>[]): Iterable<FlowNode> {
        let pending: TextRun | null = null;

        for (const arg of args) {
            for (const current of arg) {
                // Only text runs can be merged. Other nodes are kept as-is.
                if (!TextRun.classType.test(current)) {
                    if (pending !== null) {
                        yield pending;
                        pending = null;
                    }
                    yield current;
                    continue;
                }

                // Omit empty text runs
                if (current.size === 0) {
                    continue;
                }

                // If we didn't prepare for merging a text run already then
                // do so with the current one
                if (pending === null) {
                    pending = current;
                    continue;
                }

                // Merge text runs that should be merged
                if (TextRun.shouldMerge(pending, current)) {
                    pending = TextRun.merge(pending, current);
                    continue;
                }

                // The pending text run could not be merged with the current
                yield pending;
                pending = current;
            }
        }

        // Keep the trailing text run (if any)
        if (pending !== null) {
            yield pending;
        }
    }

    /** @internal */
    private static unformatAmbient(nodes: readonly FlowNode[], theme: FlowTheme): FlowNode[] {
        const result: FlowNode[] = [];
        let p = FlowContent.findParagraphBreak(nodes);
        let t: FlowTheme | undefined;
        for (let i = 0; i < nodes.length; ++i) {
            const n = nodes[i];
            if (!t) {
                t = theme.getParagraphTheme(p?.style.variant ?? "normal");
            }
            result.push(n.unformatAmbient(t));
            if (p === n) {
                p = FlowContent.findParagraphBreak(nodes, i + 1);
                t = undefined;
            }
        }
        return result;
    }

    /** @internal */
    private static findParagraphBreak(nodes: readonly FlowNode[], startIndex = 0): ParagraphBreak | null {
        for (let i = startIndex; i < nodes.length; ++i) {
            const n = nodes[i];
            if (n instanceof ParagraphBreak) {
                return n;
            }
        }
        return null;
    }
}
