import { 
    constType,
    frozen, 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    stringType, 
    type, 
    validating 
} from "paratype";
import { FlowIcon } from "../nodes/FlowIcon";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowOperationRegistry } from "../internal/class-registry";
import { getRangeAfterInsertion, getRangeAfterRemoval } from "../internal/transform-helpers";

const Props = {
    position: nonNegativeIntegerType,
    data: stringType,
};

const Data = {
    set: constType("icon"),
    at: Props.position,
    data: Props.data,
};

const PropsType: RecordType<SetIconProps> = recordType(Props);
const DataType: RecordType<SetIconData> = recordType(Data);
const propsToData = ({position, data }: SetIconProps): SetIconData => ({
    set: "icon",
    at: position,
    data,
});

/**
 * The base record class for {@link SetIcon}
 * @public
 */
export const SetIconBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link SetIcon}
 * @public
 */
export interface SetIconProps {
    /** The affected position */
    position: number;

    /** The data to assign */
    data: string;
}

/**
 * Data of {@link SetIcon}
 * @public
 */
export interface SetIconData {
    /** Data discriminator */
    set: "icon";

    /** {@inheritdoc SetIconProps.position} */
    at: number;

    /** {@inheritdoc SetIconProps.data} */
    data: string;
}

/**
 * Represents an operation that sets the path data of an icon
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class SetIcon extends SetIconBase implements SetIconProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => SetIcon);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) input: SetIconData): SetIcon {
        const { data, at: position } = input;
        const props: SetIconProps = { data, position };
        return new SetIcon(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { position } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowIcon) {
            const { data } = node;
            return new SetIcon({ position, data });
        } else {
            return null;
        }
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof SetIcon && next.position === this.position) {
            return this.set("data", next.data);
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
        const { position, data } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowIcon) {
            return content.replace(
                FlowRange.at(position, node.size),
                node.set("data", data)
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
