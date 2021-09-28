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
import { DynamicText } from "./DynamicText";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection } from "./FlowSelection";
import { FlowOperationRegistry } from "./internal/class-registry";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "./internal/transform-helpers";

const Props = {
    position: nonNegativeIntegerType,
    expression: stringType,
};

const Data = {
    edit: constType("dynamic"),
    at: Props.position,
    expr: stringType,
};

const PropsType: RecordType<EditDynamicTextProps> = recordType(Props);
const DataType: RecordType<EditDynamicTextData> = recordType(Data);
const propsToData = ({position, expression }: EditDynamicTextProps): EditDynamicTextData => ({
    edit: "dynamic",
    at: position,
    expr: expression,
});

/**
 * The base record class for {@link EditDynamicText}
 * @public
 */
export const EditDynamicTextBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link EditDynamicText}
 * @public
 */
export interface EditDynamicTextProps {
    /** The dynamic text position */
    position: number;

    /** The expression to assign */
    expression: string;
}

/**
 * Data of {@link EditDynamicText}
 * @public
 */
export interface EditDynamicTextData {
    /** Data discriminator */
    edit: "dynamic";

    /** {@inheritdoc EditDynamicTextProps.position} */
    at: number;

    /** {@inheritdoc EditDynamicTextProps.expression} */
    expr: string;
}

/**
 * Represents an operation that edit the content of a button
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class EditDynamicText extends EditDynamicTextBase implements EditDynamicTextProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => EditDynamicText);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: EditDynamicTextData): EditDynamicText {
        const { expr: expression, at: position } = data;
        const props: EditDynamicTextProps = { expression, position };
        return new EditDynamicText(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { position } = this;
        const { node } = content.peek(position);
        if (node instanceof DynamicText) {
            const { expression } = node;
            return new EditDynamicText({ position, expression });
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
        const { position, expression } = this;
        const { node } = content.peek(position);
        if (node instanceof DynamicText) {
            return content.replace(
                FlowRange.at(position, node.size),
                node.set("expression", expression)
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
