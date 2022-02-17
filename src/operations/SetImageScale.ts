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
import { FlowImage, FlowImageScaleType } from "../nodes/FlowImage";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowOperationRegistry } from "../internal/class-registry";
import { getRangeAfterInsertion, getRangeAfterRemoval } from "../internal/transform-helpers";

const Props = {
    position: nonNegativeIntegerType,
    value: FlowImageScaleType,
};

const Data = {
    set: constType("image_scale"),
    at: Props.position,
    value: Props.value,
};

const PropsType: RecordType<SetImageScaleProps> = recordType(Props);
const DataType: RecordType<SetImageScaleData> = recordType(Data);
const propsToData = ({position, value }: SetImageScaleProps): SetImageScaleData => ({
    set: "image_scale",
    at: position,
    value,
});

/**
 * The base record class for {@link SetImageScale}
 * @public
 */
export const SetImageScaleBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link SetImageScale}
 * @public
 */
export interface SetImageScaleProps {
    /** The affected position */
    position: number;

    /** The value to assign */
    value: number;
}

/**
 * Data of {@link SetImageScale}
 * @public
 */
export interface SetImageScaleData {
    /** Data discriminator */
    set: "image_scale";

    /** {@inheritdoc SetImageSourceProps.position} */
    at: number;

    /** {@inheritdoc SetImageSourceProps.value} */
    value: number;
}

/**
 * Represents an operation that sets the source of an image
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class SetImageScale extends SetImageScaleBase implements SetImageScaleProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => SetImageScale);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: SetImageScaleData): SetImageScale {
        const { value, at: position } = data;
        const props: SetImageScaleProps = { value, position };
        return new SetImageScale(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { position } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowImage) {
            const { scale } = node;
            return new SetImageScale({ position, value: scale });
        } else {
            return null;
        }
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof SetImageScale && next.position === this.position) {
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
                node.set("scale", value)
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
