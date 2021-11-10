import {
    frozen,
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
    stringType,
    type,
    validating
} from "paratype";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { TextStyle } from "../styles/TextStyle";

const Props = {
    expression: stringType,
    style: TextStyle.classType,
};
const Data = {
    dynamic: stringType,
    style: Props.style,
};
const PropsType: RecordType<DynamicTextProps> = recordType(Props);
const DataType: RecordType<DynamicTextData> = recordType(Data).withOptional("style");
const propsToData = ({expression: dynamic, style}: DynamicTextProps): DynamicTextData => (
    style.isEmpty ? { dynamic } : { dynamic, style }
);

/**
 * The base record class for {@link DynamicText}
 * @public
 */
export const DynamicTextBase = RecordClass(PropsType, InlineNode, DataType, propsToData);

/**
 * Properties of {@link DynamicText}
 * @public
 */
export interface DynamicTextProps {
    /** The dynamic expression */
    expression: string;

    /** Text style */
    style: TextStyle;
}

/**
 * Data of line break nodes
 * @public
 */
export interface DynamicTextData {
    /** The dynamic expression */
    dynamic: string;

    /** {@inheritdoc DynamicTextProps.style} */
    style?: TextStyle;
}

/**
 * Represents a dynamic text.
 * @public
 * @sealed
 */
@frozen
@validating
@FlowNodeRegistry.register
export class DynamicText extends DynamicTextBase implements DynamicTextProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => DynamicText);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: DynamicTextData): DynamicText {
        const { dynamic: expression, style = TextStyle.empty} = data;
        const props: DynamicTextProps = { expression, style };
        return new DynamicText(props);
    }
}
