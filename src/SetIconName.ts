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
import { FlowIcon } from "./FlowIcon";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection } from "./FlowSelection";
import { FlowOperationRegistry } from "./internal/class-registry";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "./internal/transform-helpers";

const Props = {
    position: nonNegativeIntegerType,
    value: stringType,
};

const Data = {
    set: constType("icon_name"),
    at: Props.position,
    value: Props.value,
};

const PropsType: RecordType<SetIconNameProps> = recordType(Props);
const DataType: RecordType<SetIconNameData> = recordType(Data);
const propsToData = ({position, value }: SetIconNameProps): SetIconNameData => ({
    set: "icon_name",
    at: position,
    value,
});

/**
 * The base record class for {@link SetIconName}
 * @public
 */
export const SetIconNameBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link SetIconName}
 * @public
 */
export interface SetIconNameProps {
    /** The affected position */
    position: number;

    /** The value to assign */
    value: string;
}

/**
 * Data of {@link SetIconName}
 * @public
 */
export interface SetIconNameData {
    /** Data discriminator */
    set: "icon_name";

    /** {@inheritdoc SetIconNameProps.position} */
    at: number;

    /** {@inheritdoc SetIconNameProps.value} */
    value: string;
}

/**
 * Represents an operation that sets the path data of an icon
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class SetIconName extends SetIconNameBase implements SetIconNameProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => SetIconName);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: SetIconNameData): SetIconName {
        const { value, at: position } = data;
        const props: SetIconNameProps = { value, position };
        return new SetIconName(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { position } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowIcon) {
            const { name } = node;
            return new SetIconName({ position, value: name });
        } else {
            return null;
        }
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof SetIconName && next.position === this.position) {
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
        if (node instanceof FlowIcon) {
            return content.replace(
                FlowRange.at(position, node.size),
                node.set("name", value)
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
