import { 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    stringType, 
    Type, 
    unionType, 
} from "paratype";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { TextStyle } from "../styles/TextStyle";
import type { FlowNodeVisitor } from "../structure/FlowNodeVisitor";
import type { FlowNode } from "./FlowNode";

const MAX_CHARS = 10000;
const RESERVED = /(?:\p{Control}|\p{Private_Use}|[\u200B-\u200D\u0085\u2028\u2029])/gu;
const UNPAIRED_HIGH_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/gu;
const UNPAIRED_LOW_SURROGATE = /(?![\uD800-\uDBFF])[\uDC00-\uDFFF]/gu;
const REPLACEMENT = "�";

const Props = {
    text: stringType
        .restrict(
            "Text content cannot contain unpaired surrogate code points",
            value => (
                !UNPAIRED_HIGH_SURROGATE.test(value) &&
                !UNPAIRED_LOW_SURROGATE.test(value)
            )
        )
        .restrict(
            "Text content cannot contain reserved character",
            value => !RESERVED.test(value),
        )
        .restrict(
            `A single text run cannot be longer than ${MAX_CHARS} characters`,
            value => value.length <= MAX_CHARS,
        ),
    style: TextStyle.classType,
};

const PropsType: RecordType<TextRunProps> = recordType(Props);
const DataType: Type<TextRunData> = unionType(Props.text, PropsType.withOptional("style"));
const propsToData = (props: TextRunProps): TextRunData => (
    props.style.isEmpty ? props.text : props
);
const EMPTY_PROPS = (): TextRunProps => Object.freeze({ text: "", style: TextStyle.empty });

/**
 * The base record class for {@link TextRun}
 * @public
 */
export const TextRunBase = RecordClass(PropsType, InlineNode, DataType, propsToData);

/**
 * Properties of a text run
 * @public
 */
export interface TextRunProps {
    /** The text characters */
    text: string;

    /** The text style */
    style: TextStyle;
}

/**
 * Data contract for a text run
 * @public
 */
export type TextRunData = string | (
    Pick<TextRunProps, "text"> &
    Partial<Omit<TextRunProps, "text">>
);

/**
 * A run of text with uniform styling
 * @public
 * @sealed
 */
@FlowNodeRegistry.register
export class TextRun extends TextRunBase implements Readonly<TextRunProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => TextRun);

    /** {@inheritdoc FlowNode.size} */
    public readonly size: number;

    /** Normalizes the specified string value */
    public static normalizeText(value: unknown): string {
        return String(value)
            .normalize()
            .replace(RESERVED, REPLACEMENT)
            .replace(UNPAIRED_HIGH_SURROGATE, REPLACEMENT)
            .replace(UNPAIRED_LOW_SURROGATE, REPLACEMENT);
    }

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: TextRunData): TextRun {
        if (typeof data === "string") {
            data = { text: data };
        }
        const { text: given, style = TextStyle.empty} = data;
        const text = TextRun.normalizeText(given);
        const props: TextRunProps = { text, style };
        return new TextRun(props);
    }

    constructor(props: TextRunProps = EMPTY_PROPS()) {
        super(props);
        this.size = props.text.length;
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept(visitor: FlowNodeVisitor): FlowNode {
        return visitor.visitTextRun(this);
    }

    /** Appends the specified text to the current text run */
    public append(value: string): TextRun {
        return this.set("text", this.text + value);
    }

    /**
     * Splits the current text run a the specified position and returns the resulting
     * text run before the split position.
     * @param position - The position at which the text run shall be split
     */
    public before(position: number): TextRun {
        this.#assertSplitPosition(position);
        return this.set("text", this.text.substr(0, position));
    }

    /**
     * Splits the current text run a the specified position and returns the resulting
     * text run after the split position.
     * @param position - The position at which the text run shall be split
     */
    public after(position: number): TextRun {
        this.#assertSplitPosition(position);
        return this.set("text", this.text.substr(position));
    }

    /**
     * Splits the current text run a the specified position and returns a tuple with the
     * resulting text runs.
     * @param position - The position at which the text run shall be split
     */
    public split(position: number): [TextRun, TextRun] {
        this.#assertSplitPosition(position);
        return [
            this.set("text", this.text.substr(0, position)),
            this.set("text", this.text.substr(position)),
        ];
    }

    /**
     * Determines whether the specified text runs should be merged into one
     * @internal
     */
    public static shouldMerge(first: TextRun, second: TextRun): boolean {
        return first.style.equals(second.style);
    }

    /**
     * Merges the specified text runs into one
     * @internal
     */
    public static merge(first: TextRun, second: TextRun): TextRun {
        return first.append(second.text);
    }

    #assertSplitPosition(position: number): void {
        if (position < 0 || position > this.size) {
            throw new RangeError("Text run cannot be split outside of its boundary");
        }
    }
}
