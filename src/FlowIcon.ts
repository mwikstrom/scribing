import {
    enumType,
    frozen,
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
    stringType,
    Type,
    type,
    validating
} from "paratype";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "./internal/class-registry";
import { TextStyle } from "./TextStyle";

const Props = {
    path: stringType,
    style: TextStyle.classType,
};
const Data = {
    icon: Props.path,
    style: Props.style,
};
const PropsType: RecordType<FlowIconProps> = recordType(Props);
const DataType: RecordType<FlowIconData> = recordType(Data).withOptional("style");
const propsToData = ({path: icon, style}: FlowIconProps): FlowIconData => (
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
    path: string;

    /** Text style */
    style: TextStyle;
}

/**
 * Data of line break nodes
 * @public
 */
export interface FlowIconData {
    /** {@inheritdoc FlowIconProps.source} */
    icon: string;

    /** {@inheritdoc FlowIconProps.style} */
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
export class FlowIcon extends FlowIconBase implements FlowIconProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowIcon);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowIconData): FlowIcon {
        const { icon: path, style = TextStyle.empty} = data;
        const props: FlowIconProps = { path, style };
        return new FlowIcon(props);
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
