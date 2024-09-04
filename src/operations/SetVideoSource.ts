import { 
    constType,
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
} from "paratype";
import { FlowVideo } from "../nodes/FlowVideo";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowOperationRegistry } from "../internal/class-registry";
import { getRangeAfterInsertion, getRangeAfterRemoval } from "../internal/transform-helpers";
import { VideoSource } from "../structure/VideoSource";

const Props = {
    position: nonNegativeIntegerType,
    value: VideoSource.classType,
};

const Data = {
    set: constType("video_source"),
    at: Props.position,
    value: Props.value,
};

const PropsType: RecordType<SetVideoSourceProps> = recordType(Props);
const DataType: RecordType<SetVideoSourceData> = recordType(Data);
const propsToData = ({position, value }: SetVideoSourceProps): SetVideoSourceData => ({
    set: "video_source",
    at: position,
    value,
});

/**
 * The base record class for {@link SetVideoSource}
 * @public
 */
export const SetVideoSourceBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link SetVideoSource}
 * @public
 */
export interface SetVideoSourceProps {
    /** The affected position */
    position: number;

    /** The value to assign */
    value: VideoSource;
}

/**
 * Data of {@link SetVideoSource}
 * @public
 */
export interface SetVideoSourceData {
    /** Data discriminator */
    set: "video_source";

    /** {@inheritdoc SetVideoSourceProps.position} */
    at: number;

    /** {@inheritdoc SetVideoSourceProps.value} */
    value: VideoSource;
}

/**
 * Represents an operation that sets the source of a video
 * @public
 * @sealed
 */
@FlowOperationRegistry.register
export class SetVideoSource extends SetVideoSourceBase implements SetVideoSourceProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => SetVideoSource);

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: SetVideoSourceData): SetVideoSource {
        const { value, at: position } = data;
        const props: SetVideoSourceProps = { value, position };
        return new SetVideoSource(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { position } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowVideo) {
            const { source } = node;
            return new SetVideoSource({ position, value: source });
        } else {
            return null;
        }
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof SetVideoSource && next.position === this.position) {
            return this.set("value", next.value);
        } else {
            return null;
        }
    }

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(other: FlowOperation): FlowOperation | null {
        // Does not affect other operation
        return other;
    }

    /**
     * {@inheritDoc FlowOperation.applyToContent}
     * @override
     */
    applyToContent(content: FlowContent): FlowContent {
        const { position, value } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowVideo) {
            return content.replace(
                FlowRange.at(position, node.size),
                node.set("source", value)
            );
        } else {
            return content;
        }
    }

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(selection: FlowSelection): FlowSelection {
        // Does not affect selection
        return selection;
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertFlow}
     */
    afterInsertFlow(range: FlowRange): FlowOperation | null {
        const before = FlowRange.at(this.position, 1);
        const after = getRangeAfterInsertion(before, range);
        return this.#wrapPosition(after);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoveFlow}
     */
    afterRemoveFlow(range: FlowRange): FlowOperation | null {
        const before = FlowRange.at(this.position, 1);
        const after = getRangeAfterRemoval(before, range);
        return this.#wrapPosition(after);
    }

    #wrapPosition(range: FlowRange | null): FlowOperation | null {
        if (range && range.size === 1) {
            return this.set("position", range.first);
        } else {
            return null;
        }
    }
}
