import {
    frozen,
    numberType,
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
    type,
    validating
} from "paratype";
import { FlowNode } from "./FlowNode";
import { ImageSource } from "../structure/ImageSource";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { TextStyle } from "../styles/TextStyle";
import type { FlowNodeVisitor } from "../structure/FlowNodeVisitor";

const Props = {
    source: ImageSource.classType,
    style: TextStyle.classType,
    scale: numberType.restrict(
        "Must be greater than 0 and less than or equal to 100", 
        value => value > 0 && value <= 100
    ),
};
const Data = {
    image: Props.source,
    style: Props.style,
    scale: Props.scale,
};
const PropsType: RecordType<FlowImageProps> = recordType(Props);
const DataType: RecordType<FlowImageData> = recordType(Data).withOptional("style", "scale");
const propsToData = ({source: image, style, scale}: FlowImageProps): FlowImageData => {
    const data: FlowImageData = { image };
    if (!style.isEmpty) {
        data.style = style;
    }
    if (scale !== 1) {
        data.scale = scale;
    }
    return data;
};

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

    /** Image rendering scale */
    scale: number;
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

    /** {@inheritdoc FlowImageProps.scale} */
    scale?: number;
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
        const { image: source, style = TextStyle.empty, scale = 1 } = data;
        const props: FlowImageProps = { source, style, scale };
        return new FlowImage(props);
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept(visitor: FlowNodeVisitor): FlowNode {
        return visitor.visitImage(this);
    }

    /**
     * {@inheritdoc FlowNode.completeUpload}
     * @override
     */
    completeUpload(id: string, url: string): FlowNode {
        const { source } = this;
        if (source.upload === id) {
            return this.set("source", source.unset("upload").set("url", url));
        } else {
            return this;
        }
    }
}
