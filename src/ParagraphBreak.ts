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
import { registerNode } from "./internal/node-registry";
import { ParagraphStyle } from "./ParagraphStyle";

const Props = {
    style: lazyType(() => ParagraphStyle.classType),
};
const Data = {
    break: constType("para"),
    style: Props.style,
};
const PropsType: RecordType<ParagraphBreakProps> = recordType(Props);
const DataType: RecordType<ParagraphBreakData> = recordType(Data).withOptional("style");
const propsToData = ({style}: ParagraphBreakProps): ParagraphBreakData => ({break: "para", style});
const EMPTY_PROPS = (): ParagraphBreakProps => Object.freeze({ style: ParagraphStyle.empty });
const BASE = RecordClass(PropsType, FlowNode, DataType, propsToData);

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
    break: "para";
    style?: ParagraphStyle;
}

/**
 * Represents a paragraph break.
 * @public
 * @sealed
 */
@frozen
@validating
@registerNode
export class ParagraphBreak extends BASE implements ParagraphBreakProps {
    public static readonly classType = recordClassType(() => ParagraphBreak);
    public readonly size = 1;

    public static fromData(@type(DataType) data: ParagraphBreakData): ParagraphBreak {
        const { style = ParagraphStyle.empty} = data;
        const props: ParagraphBreakProps = { style };
        return new ParagraphBreak(props);
    }

    constructor(props: ParagraphBreakProps = EMPTY_PROPS()) {
        super(props);
    }

    public formatText(): FlowNode {
        return this;
    }

    public formatParagraph(@type(Props.style) style: ParagraphStyle): FlowNode {
        return this.set("style", this.style.merge(style));
    }

    /** {@inheritdoc FlowNode.getTextStyle} */
    getTextStyle(): null {
        return null;
    }

    /** {@inheritdoc FlowNode.getParagraphStyle} */
    getParagraphStyle(): ParagraphStyle {
        return this.style;
    }
}
