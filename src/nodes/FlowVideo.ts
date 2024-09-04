import {
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
} from "paratype";
import { FlowNode } from "./FlowNode";
import { VideoSource } from "../structure/VideoSource";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { TextStyle } from "../styles/TextStyle";
import type { GenericFlowNodeVisitor } from "../structure/GenericFlowNodeVisitor";
import { FlowImageScaleType } from "./FlowImage";

const Props = {
    source: VideoSource.classType,
    style: TextStyle.classType,
    scale: FlowImageScaleType,
};
const Data = {
    video: Props.source,
    style: Props.style,
    scale: Props.scale,
};
const PropsType: RecordType<FlowVideoProps> = recordType(Props);
const DataType: RecordType<FlowVideoData> = recordType(Data).withOptional("style", "scale");
const propsToData = ({source: video, style, scale}: FlowVideoProps): FlowVideoData => {
    const data: FlowVideoData = { video };
    if (!style.isEmpty) {
        data.style = style;
    }
    if (scale !== 1) {
        data.scale = scale;
    }
    return data;
};

/**
 * The base record class for {@link FlowVideo}
 * @public
 */
export const FlowVideoBase = RecordClass(PropsType, InlineNode, DataType, propsToData);

/**
 * Properties of {@link FlowVideo}
 * @public
 */
export interface FlowVideoProps {
    /** The video source */
    source: VideoSource;

    /** Text style */
    style: TextStyle;

    /** Video rendering scale */
    scale: number;
}

/**
 * Data of line break nodes
 * @public
 */
export interface FlowVideoData {
    /** {@inheritdoc FlowVideoProps.source} */
    video: VideoSource;

    /** {@inheritdoc FlowVideoProps.style} */
    style?: TextStyle;

    /** {@inheritdoc FlowVideoProps.scale} */
    scale?: number;
}

/**
 * Represents a dynamic text.
 * @public
 * @sealed
 */
@FlowNodeRegistry.register
export class FlowVideo extends FlowVideoBase implements FlowVideoProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowVideo);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: FlowVideoData): FlowVideo {
        const { video: source, style = TextStyle.empty, scale = 1 } = data;
        const props: FlowVideoProps = { source, style, scale };
        return new FlowVideo(props);
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept<T>(visitor: GenericFlowNodeVisitor<T>): T {
        return visitor.visitVideo(this);
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
