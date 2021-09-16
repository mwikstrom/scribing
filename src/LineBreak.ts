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
import { InlineNode } from "./InlineNode";
import { registerNode } from "./internal/node-registry";
import { TextStyle } from "./TextStyle";

const Props = {
    style: lazyType(() => TextStyle.classType),
};
const Data = {
    break: constType("line"),
    style: Props.style,
};
const PropsType: RecordType<LineBreakProps> = recordType(Props);
const DataType: RecordType<LineBreakData> = recordType(Data).withOptional("style");
const propsToData = ({style}: LineBreakProps): LineBreakData => ({break: "line", style});
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
@frozen
@validating
@registerNode
export class LineBreak extends LineBreakBase implements LineBreakProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => LineBreak);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: LineBreakData): LineBreak {
        const { style = TextStyle.empty} = data;
        const props: LineBreakProps = { style };
        return new LineBreak(props);
    }

    constructor(props: LineBreakProps = EMPTY_PROPS()) {
        super(props);
    }
}
