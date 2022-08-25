import {
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
} from "paratype";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { TextStyle } from "../styles/TextStyle";
import type { GenericFlowNodeVisitor } from "../structure/GenericFlowNodeVisitor";
import { Script } from "../structure/Script";

const Props = {
    expression: Script.classType,
    style: TextStyle.classType,
};
const Data = {
    dynamic: Script.classType,
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
    expression: Script;

    /** Text style */
    style: TextStyle;
}

/**
 * Data of line break nodes
 * @public
 */
export interface DynamicTextData {
    /** The dynamic expression */
    dynamic: Script;

    /** {@inheritdoc DynamicTextProps.style} */
    style?: TextStyle;
}

/**
 * Represents a dynamic text.
 * @public
 * @sealed
 */
@FlowNodeRegistry.register
export class DynamicText extends DynamicTextBase implements DynamicTextProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => DynamicText);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: DynamicTextData): DynamicText {
        const { dynamic: expression, style = TextStyle.empty} = data;
        const props: DynamicTextProps = { expression, style };
        return new DynamicText(props);
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept<T>(visitor: GenericFlowNodeVisitor<T>): T {
        return visitor.visitDynamicText(this);
    }
}
