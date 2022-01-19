import { 
    arrayType, 
    frozen, 
    integerType, 
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
import { BoxStyle } from "../styles/BoxStyle";
import { FlowCursor } from "../selection/FlowCursor";
import { FlowNode } from "../nodes/FlowNode";
import { FlowRange } from "../selection/FlowRange";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowNodeRegistry } from "../internal/class-registry";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { ParagraphStyle } from "../styles/ParagraphStyle";
import { ParagraphTheme } from "../styles/ParagraphTheme";
import { TextRun } from "../nodes/TextRun";
import { TextStyle } from "../styles/TextStyle";

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
 * @public
 */
export type FlowContentHashFunc = (data: Uint8Array) => Promise<Buffer>;

let DEFAULT_HASH_FUNC: FlowContentHashFunc = async data => {
    const hash = await crypto.subtle.digest("SHA-384", data);
    return Buffer.from(hash);
};

/**
 * Flow content
 * @public
 * @sealed
 */
@frozen
@validating
export class FlowContent extends FlowContentBase implements Readonly<FlowContentProps> {
    #cachedDigest: string | undefined;
    #cachedDigestFunc: FlowContentHashFunc | undefined;

    /** The MIME type that should be used for flow content JSON data */
    public static readonly jsonMimeType = "application/vnd.scribing-flow+json";

    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowContent);

    static get defaultHashFunc(): FlowContentHashFunc { return DEFAULT_HASH_FUNC; }
    static set defaultHashFunc(func: FlowContentHashFunc) { DEFAULT_HASH_FUNC = func; }

    /** Gets empty flow content */
    public static get empty(): FlowContent {
        if (!EMPTY_CACHE) {
            EMPTY_CACHE = new FlowContent({ nodes: Object.freeze([]) });
        }
        return EMPTY_CACHE;
    }

    /** Gets an empty paragraph */
    public static get emptyParagraph(): FlowContent {
        if (!EMPTY_PARA_CACHE) {
            EMPTY_PARA_CACHE = new FlowContent({ nodes: Object.freeze([new ParagraphBreak()]) });
        }
        return EMPTY_PARA_CACHE;
    }

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
     * Marks the specified upload as completed
     * @param id - Identifies the completed upload
     * @param url - URL of the uploaded resource
     */
    completeUpload(id: string, url: string): FlowContent {
        const range = FlowRange.at(0, this.size);
        return this.set("nodes", this.#replace(range, node => node.completeUpload(id, url)));
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
     * Gets a cryptographic digest of the current content
     */
    async digest(hashFunc = FlowContent.defaultHashFunc): Promise<string> {
        if (!this.#cachedDigest || this.#cachedDigestFunc !== hashFunc) {
            const json = this.toJsonValue();
            const text = JSON.stringify(json);
            const data = new TextEncoder().encode(text);
            const hash = await hashFunc(data);
            this.#cachedDigest = hash.toString("base64");
            this.#cachedDigestFunc = hashFunc;
        }
        return this.#cachedDigest;
    }

    /**
     * Applies box style to a range
     * 
     * @param range - The range to format
     * @param style - The style to apply
     * @returns The updated flow content
     */
    formatBox(
        @type(FlowRange.classType) range: FlowRange, 
        @type(BoxStyle.classType) style: BoxStyle,
            theme?: FlowTheme,
    ): FlowContent {
        // TODO: Verify theme arg
        return this.set("nodes", this.#replace(range, node => node.formatBox(style, theme), theme));
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
        return this.set("nodes", this.#replace(range, node => node.formatParagraph(style, theme), theme));
    }

    /**
     * Applies text style to a range
     * @param range - The range to format
     * @param style - The style to apply
     * @param theme - Theme of the current content
     * @returns The updated flow content
     */
    formatText(
        @type(FlowRange.classType) range: FlowRange,
        @type(TextStyle.classType) style: TextStyle,
            theme?: FlowTheme,
    ): FlowContent {
        // TODO: Verify theme arg
        return this.set("nodes", this.#replace(range, node => node.formatText(style, theme), theme));
    }

    /**
     * Increments list level of nodes in the specified range
     * 
     * @param range - The range to format
     * @param delta - The delta increment
     * @param theme - Theme of the current content
     * @returns The updated flow content
     */
    incrementListLevel(
        @type(FlowRange.classType) range: FlowRange, 
        @type(integerType) delta: number,
            theme?: FlowTheme,
    ): FlowContent {
        return this.set("nodes", this.#replace(range, node => {
            if (node instanceof ParagraphBreak) {
                const { listLevel: before = 0 } = node.style;
                const after = Math.max(0, Math.min(9, before + delta));
                if (before !== after) {
                    return node.formatParagraph(ParagraphStyle.empty.set("listLevel", after));
                }
            }
            return node;
        }, theme));
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

    /**
     * Replaces the specified range with the specified nodes
     * @param remove - The range to be removed
     * @param insert - The nodes to insert at the start of the removed range
     */
    replace(remove: FlowRange, ...insert: FlowNode[]): FlowContent {
        return this.remove(remove).insert(remove.first, ...insert);
    }

    /** Gets a JSON value representation of the current content */
    toJsonValue(): JsonValue {
        return FlowContent.classType.toJsonValue(this);
    }

    /**
     * Unapplies the ambient style of the specified theme from the current content.
     * @param theme - The theme that provides ambient styling
     */
    unformatAmbient(theme: FlowTheme): FlowContent {
        return this.set("nodes", Object.freeze(FlowContent.unformatAmbient(this.nodes, theme)));
    }
    
    /**
     * Unapplies box style to a range
     * 
     * @param range - The range to format
     * @param style - The style to unapply
     * @returns The updated flow content
     */
    unformatBox(
        @type(FlowRange.classType) range: FlowRange, 
        @type(BoxStyle.classType) style: BoxStyle
    ): FlowContent {
        return this.set("nodes", this.#replace(range, node => node.unformatBox(style)));
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
        return this.set("nodes", this.#replace(range, node => node.unformatParagraph(style)));
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
        return this.set("nodes", this.#replace(range, node => node.unformatText(style)));
    }
    
    #replace(range: FlowRange, callback: (node: FlowNode) => FlowNode, theme?: FlowTheme): readonly FlowNode[] {
        const first = this.peek(range.first);
        const before = first.before;
        const inner = Array.from(first.range(range.size)).map(callback);
        const after = first.move(range.size).after;
        let result = Array.from(FlowContent.merge(before, inner, after));
        if (theme) {
            result = Array.from(FlowContent.merge(FlowContent.unformatAmbient(result, theme)));
        }
        return Object.freeze(result);
    }

    #insert(position: number, first: FlowTheme | FlowNode | undefined, ...rest: readonly FlowNode[]): FlowContent {
        const { before, after } = this.peek(position);
        const theme = first instanceof FlowTheme ? first : undefined;
        const inner = [...rest];
        if (first instanceof FlowNode) {
            inner.unshift(first);
        }
        let result = Array.from(FlowContent.merge(before, inner, after));
        if (theme) {
            result = Array.from(FlowContent.merge(FlowContent.unformatAmbient(result, theme)));
        }
        return this.set("nodes", Object.freeze(result));
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
        let t: ParagraphTheme | undefined;
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

let EMPTY_CACHE: FlowContent | undefined;
let EMPTY_PARA_CACHE: FlowContent | undefined;
