import { 
    constType,
    frozen, 
    nonNegativeIntegerType, 
    nullType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    type, 
    unionType, 
    validating 
} from "paratype";
import { FlowButton } from "./FlowButton";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection } from "./FlowSelection";
import { Interaction } from "./Interaction";
import { FlowOperationRegistry } from "./internal/class-registry";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "./internal/transform-helpers";

const Props = {
    position: nonNegativeIntegerType,
    action: unionType(nullType, Interaction.baseType),
};

const Data = {
    set: constType("button_action"),
    at: Props.position,
    value: Props.action,
};

const PropsType: RecordType<SetButtonActionProps> = recordType(Props);
const DataType: RecordType<SetButtonActionData> = recordType(Data);
const propsToData = ({position, action }: SetButtonActionProps): SetButtonActionData => ({
    set: "button_action",
    at: position,
    value: action,
});

/**
 * The base record class for {@link SetButtonAction}
 * @public
 */
export const SetButtonActionBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link SetButtonAction}
 * @public
 */
export interface SetButtonActionProps {
    /** The dynamic text position */
    position: number;

    /** The interaction to assign */
    action: Interaction | null;
}

/**
 * Data of {@link SetButtonAction}
 * @public
 */
export interface SetButtonActionData {
    /** Data discriminator */
    set: "button_action";

    /** {@inheritdoc SetButtonActionProps.position} */
    at: number;

    /** {@inheritdoc SetButtonActionProps.action} */
    value: Interaction | null;
}

/**
 * Represents an operation that edit the content of a button
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class SetButtonAction extends SetButtonActionBase implements SetButtonActionProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => SetButtonAction);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: SetButtonActionData): SetButtonAction {
        const { value: action, at: position } = data;
        const props: SetButtonActionProps = { action, position };
        return new SetButtonAction(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { position } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowButton) {
            const { action } = node;
            return new SetButtonAction({ position, action });
        } else {
            return null;
        }
    }

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(other: FlowOperation): FlowOperation | null {
        // Setting dynamic text expression does not affect other operation
        return other;
    }

    /**
     * {@inheritDoc FlowOperation.applyToContent}
     * @override
     */
    applyToContent(content: FlowContent): FlowContent {
        const { position, action } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowButton) {
            return content.replace(
                FlowRange.at(position, node.size),
                node.set("action", action)
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
        // Setting dynamic text does not affect selection
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
