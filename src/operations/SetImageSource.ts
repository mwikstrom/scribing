import { 
    constType,
    frozen, 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    type, 
    validating 
} from "paratype";
import { FlowImage } from "../nodes/FlowImage";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowOperationRegistry } from "../internal/class-registry";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "../internal/transform-helpers";
import { ImageSource } from "../structure/ImageSource";

const Props = {
    position: nonNegativeIntegerType,
    value: ImageSource.classType,
};

const Data = {
    set: constType("image_source"),
    at: Props.position,
    value: Props.value,
};

const PropsType: RecordType<SetImageSourceProps> = recordType(Props);
const DataType: RecordType<SetImageSourceData> = recordType(Data);
const propsToData = ({position, value }: SetImageSourceProps): SetImageSourceData => ({
    set: "image_source",
    at: position,
    value,
});

/**
 * The base record class for {@link SetImageSource}
 * @public
 */
export const SetImageSourceBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link SetImageSource}
 * @public
 */
export interface SetImageSourceProps {
    /** The affected position */
    position: number;

    /** The value to assign */
    value: ImageSource;
}

/**
 * Data of {@link SetImageSource}
 * @public
 */
export interface SetImageSourceData {
    /** Data discriminator */
    set: "image_source";

    /** {@inheritdoc SetImageSourceProps.position} */
    at: number;

    /** {@inheritdoc SetImageSourceProps.value} */
    value: ImageSource;
}

/**
 * Represents an operation that sets the source of an image
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class SetImageSource extends SetImageSourceBase implements SetImageSourceProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => SetImageSource);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: SetImageSourceData): SetImageSource {
        const { value, at: position } = data;
        const props: SetImageSourceProps = { value, position };
        return new SetImageSource(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { position } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowImage) {
            const { source } = node;
            return new SetImageSource({ position, value: source });
        } else {
            return null;
        }
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof SetImageSource && next.position === this.position) {
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
        if (node instanceof FlowImage) {
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
     * {@inheritDoc FlowOperation.afterInsertion}
     */
    afterInsertion(range: FlowRange): FlowOperation | null {
        const before = FlowRange.at(this.position, 1);
        const after = transformRangeAfterInsertion(before, range);
        return this.#wrapPosition(after);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoval}
     */
    afterRemoval(range: FlowRange): FlowOperation | null {
        const before = FlowRange.at(this.position, 1);
        const after = transformRangeAfterRemoval(before, range);
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
