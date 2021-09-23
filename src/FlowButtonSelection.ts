import { 
    frozen, 
    lazyType, 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating 
} from "paratype";
import { FlowButton } from "./FlowButton";
import { FlowContent } from "./FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowOperation } from "./FlowOperation";
import { FlowSelection } from "./FlowSelection";
import { FlowSelectionRegistry } from "./internal/class-registry";
import { NestedFlowSelection } from "./NestedFlowSelection";

const Props = {
    position: nonNegativeIntegerType,
    content: lazyType(() => FlowSelection.baseType),
};

const Data = {
    button: Props.position,
    content: Props.content,
};

const PropsType: RecordType<FlowButtonSelectionProps> = recordType(Props);
const DataType: RecordType<FlowButtonSelectionData> = recordType(Data);

const propsToData = (
    { position: button, content, }: FlowButtonSelectionProps
): FlowButtonSelectionData => ({ button, content });

/**
 * The base record class for {@link FlowButtonSelection}
 * @public
 */
export const FlowButtonSelectionBase = RecordClass(PropsType, NestedFlowSelection, DataType, propsToData);

/**
 * Properties of {@link FlowButtonSelection}
 * @public
 */
export interface FlowButtonSelectionProps {
    position: number;
    content: FlowSelection;
}

/**
 * Data of {@link FlowButtonSelection}
 * @public
 */
export interface FlowButtonSelectionData {
    button: number;
    content: FlowSelection;
}

/**
 * Represents a selection inside a flow button
 * @public
 * @sealed
 */
@frozen
@validating
@FlowSelectionRegistry.register
export class FlowButtonSelection extends FlowButtonSelectionBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowButtonSelection);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowButtonSelectionData): FlowButtonSelection {
        const { button: position, content } = data;
        return new FlowButtonSelection({ position, content });
    }

    /**
     * {@inheritDoc NestedFlowSelection.getInnerContentFromNode}
     * @override
     */
    protected getInnerContentFromNode(node: FlowNode): FlowContent {
        if (node instanceof FlowButton) {
            return node.content;
        } else {
            throw new Error(`Expected a flow button at position ${this.position}`);
        }
    }

    /**
     * {@inheritDoc NestedFlowSelection.getInnerSelection}
     * @override
     */
    protected getInnerSelection(): FlowSelection {
        return this.content;
    }

    /**
     * {@inheritDoc NestedFlowSelection.getOuterOperation}
     * @override
     */
    protected getOuterOperation(inner: FlowOperation): FlowOperation {
        const { position } = this;
        // return new EditButtonContent({ position, operation: inner });
        throw new Error("TODO: Need EditButton operation");
    }

    /**
     * {@inheritDoc NestedFlowSelection.setInnerSelection}
     * @override
     */
    protected setInnerSelection(value: FlowSelection): NestedFlowSelection {
        return this.set("content", value);
    }
}