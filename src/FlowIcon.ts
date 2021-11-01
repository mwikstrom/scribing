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
    name: stringType,
    style: TextStyle.classType,
};
const Data = {
    icon: Props.name,
    style: Props.style,
};
const PropsType: RecordType<FlowIconProps> = recordType(Props);
const DataType: RecordType<FlowIconData> = recordType(Data).withOptional("style");
const propsToData = ({name: icon, style}: FlowIconProps): FlowIconData => (
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
    name: string;

    /** Text style */
    style: TextStyle;
}

/**
 * Data of line break nodes
 * @public
 */
export interface FlowIconData {
    /** {@inheritdoc FlowIconProps.name} */
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
        const { icon: name, style = TextStyle.empty} = data;
        const props: FlowIconProps = { name, style };
        return new FlowIcon(props);
    }
}

/**
 * Predefined icon
 * @public
 */
export type PredefinedIcon = (typeof PREDEFINED_ICON_NAMES)[number];

/**
 * Read-only array that contains all predefined icons
 * @public
 */
export const PREDEFINED_ICON_NAMES = Object.freeze([
    "information",
    "success",
    "warning",
    "error",
] as const);
 
/**
 * The run-time type that matches predefined icon types
 * @public
 */
export const PredefinedIconNameType: Type<PredefinedIcon> = enumType(PREDEFINED_ICON_NAMES);
