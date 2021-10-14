import {
    constType,
    frozen,
    lazyType,
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
    type,
    validating
} from "paratype";
import { FlowNode } from "./FlowNode";
import { FlowNodeRegistry } from "./internal/class-registry";
import { ParagraphStyle } from "./ParagraphStyle";
import { ParagraphTheme } from "./ParagraphTheme";
import { TextStyle } from "./TextStyle";

const Props = {
    style: lazyType(() => ParagraphStyle.classType),
};
const Data = {
    break: constType("para"),
    style: Props.style,
};
const PropsType: RecordType<ParagraphBreakProps> = recordType(Props);
const DataType: RecordType<ParagraphBreakData> = recordType(Data).withOptional("style");
const propsToData = ({style}: ParagraphBreakProps): ParagraphBreakData => (
    style.isEmpty ? {break: "para"} : {break: "para", style}
);
const EMPTY_PROPS = (): ParagraphBreakProps => Object.freeze({ style: ParagraphStyle.empty });

/**
 * The base record class for {@link ParagraphBreak}
 * @public
 */
export const ParagraphBreakBase = RecordClass(PropsType, FlowNode, DataType, propsToData);

/**
 * Properties of paragraph break nodes
 * @public
 */
export interface ParagraphBreakProps {
    /**
     * Style for the preceding paragraph
     */
    style: ParagraphStyle;
}

/**
 * Data of paragraph break nodes
 * @public
 */
export interface ParagraphBreakData {
    /** Data classifier */
    break: "para";

    /** {@inheritdoc ParagraphBreakProps.style} */
    style?: ParagraphStyle;
}

/**
 * Represents a paragraph break.
 * @public
 * @sealed
 */
@frozen
@validating
@FlowNodeRegistry.register
export class ParagraphBreak extends ParagraphBreakBase implements ParagraphBreakProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => ParagraphBreak);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: ParagraphBreakData): ParagraphBreak {
        const { style = ParagraphStyle.empty} = data;
        const props: ParagraphBreakProps = { style };
        return new ParagraphBreak(props);
    }

    constructor(props: ParagraphBreakProps = EMPTY_PROPS()) {
        super(props);
    }

    /** {@inheritdoc FlowNode.formatParagraph} */
    public formatParagraph(@type(Props.style) style: ParagraphStyle): this {
        return this.set("style", this.style.merge(style));
    }

    /** {@inheritdoc FlowNode.formatText} */
    public formatText(): this {
        return this;
    }

    /**
     * {@inheritDoc FlowNode.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(theme?: ParagraphTheme): ParagraphStyle | null {
        const ambient = theme?.getAmbientParagraphStyle() ?? ParagraphStyle.empty;
        return ambient.isEmpty ? this.style : ambient.merge(this.style);
    }

    /**
     * {@inheritDoc FlowNode.getUniformTextStyle}
     * @override
     */
    public getUniformTextStyle(theme?: ParagraphTheme): TextStyle {
        const ambient = theme?.getAmbientTextStyle() ?? TextStyle.empty;
        return ambient;
    }

    /** {@inheritdoc FlowNode.unformatAmbient} */
    public unformatAmbient(theme: ParagraphTheme): this {
        return this.unformatParagraph(theme.getAmbientParagraphStyle().unset("variant"));
    }

    /** {@inheritdoc FlowNode.unformatParagraph} */
    public unformatParagraph(@type(Props.style) style: ParagraphStyle): this {
        return this.set("style", this.style.unmerge(style));
    }

    /** {@inheritdoc FlowNode.unformatText} */
    public unformatText(): this {
        return this;
    }
}
