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
import { DefaultFlowTheme } from "../styles/DefaultFlowTheme";
import { FlowTable } from "../nodes/FlowTable";
import { FlowContent } from "../structure/FlowContent";
import { FlowNode } from "../nodes/FlowNode";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection } from "./FlowSelection";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowSelectionRegistry } from "../internal/class-registry";
import { NestedFlowSelection } from "./NestedFlowSelection";
import { CellPosition } from "./CellPosition";
import { EditTableCell } from "../operations/EditTableCell";

const Props = {
    position: nonNegativeIntegerType,
    cell: CellPosition.classType,
    content: lazyType(() => FlowSelection.baseType),
};

const Data = {
    table: Props.position,
    cell: CellPosition.classType,
    content: Props.content,
};

const PropsType: RecordType<FlowTableCellSelectionProps> = recordType(Props);
const DataType: RecordType<FlowTableCellSelectionData> = recordType(Data);

const propsToData = (
    { position: table, cell, content, }: FlowTableCellSelectionProps
): FlowTableCellSelectionData => ({ table, cell, content });

/**
 * The base record class for {@link FlowTableCellSelection}
 * @public
 */
export const FlowTableCellSelectionBase = RecordClass(PropsType, NestedFlowSelection, DataType, propsToData);

/**
 * Properties of {@link FlowTableCellSelection}
 * @public
 */
export interface FlowTableCellSelectionProps {
    position: number;
    cell: CellPosition;
    content: FlowSelection;
}

/**
 * Data of {@link FlowTableCellSelection}
 * @public
 */
export interface FlowTableCellSelectionData {
    table: number;
    cell: CellPosition;
    content: FlowSelection;
}

/**
 * Represents a selection inside a flow table cell
 * @public
 * @sealed
 */
@frozen
@validating
@FlowSelectionRegistry.register
export class FlowTableCellSelection extends FlowTableCellSelectionBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowTableCellSelection);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowTableCellSelectionData): FlowTableCellSelection {
        const { table: position, cell, content } = data;
        return new FlowTableCellSelection({ position, cell, content });
    }

    /**
     * {@inheritDoc NestedFlowSelection.getInnerContentFromNode}
     * @override
     */
    protected getInnerContentFromNode(node: FlowNode): FlowContent {
        if (node instanceof FlowTable) {
            return node.content.getCell(this.cell, true).content;
        } else {
            throw new Error(`Expected a flow table at position ${this.position}`);
        }
    }

    /**
     * {@inheritDoc NestedFlowSelection.getInnerThemeFromNode}
     * @override
     */
    protected getInnerThemeFromNode(node: FlowNode, outer?: FlowTheme): FlowTheme {
        if (node instanceof FlowTable) {
            // TODO: Table theme
            return (outer ?? DefaultFlowTheme.instance);
        } else {
            throw new Error(`Expected a flow table at position ${this.position}`);
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
        const { position, cell } = this;
        return new EditTableCell({ position, cell, inner });
    }

    /**
     * {@inheritDoc NestedFlowSelection.setInnerSelection}
     * @override
     */
    protected setInnerSelection(value: FlowSelection): NestedFlowSelection {
        return this.set("content", value);
    }
}