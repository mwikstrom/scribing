import {
    enumType,
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
    stringType,
    Type,
} from "paratype";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { TextStyle } from "../styles/TextStyle";
import type { GenericFlowNodeVisitor } from "../structure/GenericFlowNodeVisitor";

const Props = {
    data: stringType,
    style: TextStyle.classType,
};
const Data = {
    icon: Props.data,
    style: Props.style,
};
const PropsType: RecordType<FlowIconProps> = recordType(Props);
const DataType: RecordType<FlowIconData> = recordType(Data).withOptional("style");
const propsToData = ({data: icon, style}: FlowIconProps): FlowIconData => (
    style.isEmpty ? { icon } : { icon, style }
);

/**
 * The base record class for {@link FlowIcon}
 * @public
 */
export const FlowIconBase = RecordClass(PropsType, InlineNode, DataType, propsToData);

/**
 * Properties of {@link FlowIcon}
 * @public
 */
export interface FlowIconProps {
    /** The icon path data */
    data: string;

    /** Text style */
    style: TextStyle;
}

/**
 * Data of line break nodes
 * @public
 */
export interface FlowIconData {
    /** {@inheritdoc FlowIconProps.data} */
    icon: string;

    /** {@inheritdoc FlowIconProps.style} */
    style?: TextStyle;
}

/**
 * Represents a dynamic text.
 * @public
 * @sealed
 */
@FlowNodeRegistry.register
export class FlowIcon extends FlowIconBase implements FlowIconProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowIcon);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: FlowIconData): FlowIcon {
        const { icon, style = TextStyle.empty} = data;
        const props: FlowIconProps = { data: icon, style };
        return new FlowIcon(props);
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept<T>(visitor: GenericFlowNodeVisitor<T>): T {
        return visitor.visitIcon(this);
    }
}

/**
 * Predefined icon
 * @public
 */
export type PredefinedIcon = (typeof PREDEFINED_ICONS)[number];

/**
 * Read-only array that contains all predefined icons
 * @public
 */
export const PREDEFINED_ICONS = Object.freeze([
    "information",
    "success",
    "warning",
    "error",
] as const);
 
/**
 * The run-time type that matches predefined icon types
 * @public
 */
export const PredefinedIconType: Type<PredefinedIcon> = enumType(PREDEFINED_ICONS);
