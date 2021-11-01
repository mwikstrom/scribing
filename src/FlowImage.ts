import {
    frozen,
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
    type,
    validating
} from "paratype";
import { ImageSource } from "./ImageSource";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "./internal/class-registry";
import { TextStyle } from "./TextStyle";

const Props = {
    source: ImageSource.classType,
    style: TextStyle.classType,
};
const Data = {
    image: Props.source,
    style: Props.style,
};
const PropsType: RecordType<FlowImageProps> = recordType(Props);
const DataType: RecordType<FlowImageData> = recordType(Data).withOptional("style");
const propsToData = ({source: image, style}: FlowImageProps): FlowImageData => (
    style.isEmpty ? { image } : { image, style }
);

/**
 * The base record class for {@link FlowImage}
 * @public
 */
export const FlowImageBase = RecordClass(PropsType, InlineNode, DataType, propsToData);

/**
 * Properties of {@link FlowImage}
 * @public
 */
export interface FlowImageProps {
    /** The image source */
    source: ImageSource;

    /** Text style */
    style: TextStyle;
}

/**
 * Data of line break nodes
 * @public
 */
export interface FlowImageData {
    /** {@inheritdoc FlowImageProps.source} */
    image: ImageSource;

    /** {@inheritdoc FlowImageProps.style} */
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
export class FlowImage extends FlowImageBase implements FlowImageProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowImage);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowImageData): FlowImage {
        const { image: source, style = TextStyle.empty} = data;
        const props: FlowImageProps = { source, style };
        return new FlowImage(props);
    }
}
