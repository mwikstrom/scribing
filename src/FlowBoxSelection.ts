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
import { EditBox } from "./EditBox";
import { FlowBox } from "./FlowBox";
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
    box: Props.position,
    content: Props.content,
};

const PropsType: RecordType<FlowBoxSelectionProps> = recordType(Props);
const DataType: RecordType<FlowBoxSelectionData> = recordType(Data);

const propsToData = (
    { position: box, content, }: FlowBoxSelectionProps
): FlowBoxSelectionData => ({ box, content });

/**
 * The base record class for {@link FlowBoxSelection}
 * @public
 */
export const FlowBoxSelectionBase = RecordClass(PropsType, NestedFlowSelection, DataType, propsToData);

/**
 * Properties of {@link FlowBoxSelection}
 * @public
 */
export interface FlowBoxSelectionProps {
    position: number;
    content: FlowSelection;
}

/**
 * Data of {@link FlowBoxSelection}
 * @public
 */
export interface FlowBoxSelectionData {
    box: number;
    content: FlowSelection;
}

/**
 * Represents a selection inside a flow box
 * @public
 * @sealed
 */
@frozen
@validating
@FlowSelectionRegistry.register
export class FlowBoxSelection extends FlowBoxSelectionBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowBoxSelection);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowBoxSelectionData): FlowBoxSelection {
        const { box: position, content } = data;
        return new FlowBoxSelection({ position, content });
    }

    /**
     * {@inheritDoc NestedFlowSelection.getInnerContentFromNode}
     * @override
     */
    protected getInnerContentFromNode(node: FlowNode): FlowContent {
        if (node instanceof FlowBox) {
            return node.content;
        } else {
            throw new Error(`Expected a flow box at position ${this.position}`);
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
        return new EditBox({ position, inner });
    }

    /**
     * {@inheritDoc NestedFlowSelection.setInnerSelection}
     * @override
     */
    protected setInnerSelection(value: FlowSelection): NestedFlowSelection {
        return this.set("content", value);
    }
}