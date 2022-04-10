import {
    constType,
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
} from "paratype";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { TextStyle } from "../styles/TextStyle";
import type { FlowNodeVisitor } from "../structure/FlowNodeVisitor";
import type { FlowNode } from "./FlowNode";

const Props = {
    style: TextStyle.classType,
};
const Data = {
    break: constType("line"),
    style: Props.style,
};
const PropsType: RecordType<LineBreakProps> = recordType(Props);
const DataType: RecordType<LineBreakData> = recordType(Data).withOptional("style");
const propsToData = ({style}: LineBreakProps): LineBreakData => (
    style.isEmpty ? {break: "line"} : {break: "line", style}
);
const EMPTY_PROPS = (): LineBreakProps => Object.freeze({ style: TextStyle.empty });

/**
 * The base record class for {@link LineBreak}
 * @public
 */
export const LineBreakBase = RecordClass(PropsType, InlineNode, DataType, propsToData);

/**
 * Properties of line break nodes
 * @public
 */
export interface LineBreakProps {
    /**
     * Text style for the line break
     */
    style: TextStyle;
}

/**
 * Data of line break nodes
 * @public
 */
export interface LineBreakData {
    /** Data classifier */
    break: "line";

    /** {@inheritdoc LineBreakProps.style} */
    style?: TextStyle;
}

/**
 * Represents a line break.
 * @public
 * @sealed
 */
@FlowNodeRegistry.register
export class LineBreak extends LineBreakBase implements LineBreakProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => LineBreak);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: LineBreakData): LineBreak {
        const { style = TextStyle.empty} = data;
        const props: LineBreakProps = { style };
        return new LineBreak(props);
    }

    constructor(props: LineBreakProps = EMPTY_PROPS()) {
        super(props);
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept(visitor: FlowNodeVisitor): FlowNode {
        return visitor.visitLineBreak(this);
    }
}
