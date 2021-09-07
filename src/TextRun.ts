import { 
    frozen, 
    integerType, 
    lazyType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    stringType, 
    type, 
    Type, 
    unionType, 
    validating
} from "paratype";
import { FlowNode } from "./FlowNode";
import { registerNode } from "./internal/node-registry";
import { TextStyle } from "./TextStyle";

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
    style: lazyType(() => TextStyle.classType),
};

const PropsType: RecordType<TextRunProps> = recordType(Props);
const DataType: Type<TextRunData> = unionType(Props.text, PropsType.withOptional("style"));
const propsToData = (props: TextRunProps): TextRunData => (
    props.style.isEmpty ? props.text : props
);
const EMPTY_PROPS = (): TextRunProps => Object.freeze({ text: "", style: TextStyle.empty });
const BASE = RecordClass(PropsType, FlowNode, DataType, propsToData);

/**
 * Properties of a text run
 * @public
 */
export interface TextRunProps {
    text: string;
    style: TextStyle;
}

/**
 * Data contract for a text run
 * @public
 */
export type TextRunData = string | {
    text: string;
    style?: TextStyle;
};

/**
 * A run of text with uniform styling
 * @public
 * @sealed
 */
@frozen
@validating
@registerNode
export class TextRun extends BASE implements Readonly<TextRunProps> {
    public static readonly classType = recordClassType(() => TextRun);
    public readonly size: number;

    public static normalizeText(value: unknown): string {
        return String(value)
            .normalize()
            .replace(RESERVED, REPLACEMENT)
            .replace(UNPAIRED_HIGH_SURROGATE, REPLACEMENT)
            .replace(UNPAIRED_LOW_SURROGATE, REPLACEMENT);
    }

    public static fromData(@type(DataType) data: TextRunData): TextRun {
        if (typeof data === "string") {
            data = { text: data };
        }
        const { text, style = TextStyle.empty} = data;
        const props: TextRunProps = { text, style };
        return new TextRun(props);
    }

    // TODO: a generic way for normalizing input (maybe use for FlowContent's merge too?)
    constructor(props: TextRunProps = EMPTY_PROPS()) {
        super(props);
        this.size = props.text.length;
    }

    public append(@type(stringType) value: string): TextRun {
        return this.set("text", this.text + value);
    }

    public formatText(@type(Props.style) style: TextStyle): FlowNode {
        return this.set("style", this.style.merge(style));
    }

    public formatParagraph(): FlowNode {
        return this;
    }

    /** {@inheritdoc FlowNode.getTextStyle} */
    getTextStyle(): TextStyle {
        return this.style;
    }

    /** {@inheritdoc FlowNode.getParagraphStyle} */
    getParagraphStyle(): null {
        return null;
    }

    public before(@type(integerType) position: number): TextRun {
        this.#assertSplitPosition(position);
        return this.set("text", this.text.substr(0, position));
    }

    public after(@type(integerType) position: number): TextRun {
        this.#assertSplitPosition(position);
        return this.set("text", this.text.substr(position));
    }

    public split(@type(integerType) position: number): [TextRun, TextRun] {
        this.#assertSplitPosition(position);
        return [
            this.set("text", this.text.substr(0, position)),
            this.set("text", this.text.substr(position)),
        ];
    }

    #assertSplitPosition(position: number): void {
        if (position < 0 || position > this.size) {
            throw new RangeError("Text run cannot be split outside of its boundary");
        }
    }
}
