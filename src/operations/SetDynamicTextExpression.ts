import { 
    constType,
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
} from "paratype";
import { DynamicText } from "../nodes/DynamicText";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowOperationRegistry } from "../internal/class-registry";
import { getRangeAfterInsertion, getRangeAfterRemoval } from "../internal/transform-helpers";
import { Script } from "../structure/Script";

const Props = {
    position: nonNegativeIntegerType,
    expression: Script.classType,
};

const Data = {
    set: constType("dynamic_text_expression"),
    at: Props.position,
    value: Script.classType,
};

const PropsType: RecordType<SetDynamicTextExpressionProps> = recordType(Props);
const DataType: RecordType<SetDynamicTextExpressionData> = recordType(Data);
const propsToData = ({position, expression }: SetDynamicTextExpressionProps): SetDynamicTextExpressionData => ({
    set: "dynamic_text_expression",
    at: position,
    value: expression,
});

/**
 * The base record class for {@link SetDynamicTextExpression}
 * @public
 */
export const SetDynamicTextExpressionBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link SetDynamicTextExpression}
 * @public
 */
export interface SetDynamicTextExpressionProps {
    /** The dynamic text position */
    position: number;

    /** The expression to assign */
    expression: Script;
}

/**
 * Data of {@link SetDynamicTextExpression}
 * @public
 */
export interface SetDynamicTextExpressionData {
    /** Data discriminator */
    set: "dynamic_text_expression";

    /** {@inheritdoc SetDynamicTextExpressionProps.position} */
    at: number;

    /** {@inheritdoc SetDynamicTextExpressionProps.expression} */
    value: Script;
}

/**
 * Represents an operation that sets the expression of dynamic text
 * @public
 * @sealed
 */
@FlowOperationRegistry.register
export class SetDynamicTextExpression extends SetDynamicTextExpressionBase implements SetDynamicTextExpressionProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => SetDynamicTextExpression);

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: SetDynamicTextExpressionData): SetDynamicTextExpression {
        const { value: expression, at: position } = data;
        const props: SetDynamicTextExpressionProps = { expression, position };
        return new SetDynamicTextExpression(props);
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
            return new SetDynamicTextExpression({ position, expression });
        } else {
            return null;
        }
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof SetDynamicTextExpression && next.position === this.position) {
            return this.set("expression", next.expression);
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
