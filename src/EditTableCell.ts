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
import { DefaultFlowTheme } from "./DefaultFlowTheme";
import { FlowTable } from "./FlowTable";
import { FlowContent } from "./FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowOperation } from "./FlowOperation";
import { FlowTheme } from "./FlowTheme";
import { FlowOperationRegistry } from "./internal/class-registry";
import { NestedFlowOperation } from "./NestedFlowOperation";

const Props = {
    position: nonNegativeIntegerType,
    row: nonNegativeIntegerType,
    column: nonNegativeIntegerType,
    inner: FlowOperation.baseType,
};

const Data = {
    edit: constType("cell"),
    at: Props.position,
    row: Props.row,
    column: Props.column,
    op: Props.inner,
};

const PropsType: RecordType<EditTableCellProps> = recordType(Props);
const DataType: RecordType<EditTableCellData> = recordType(Data);
const propsToData = ({position, row, column, inner }: EditTableCellProps): EditTableCellData => ({
    edit: "cell",
    at: position,
    row,
    column,
    op: inner,
});

/**
 * The base record class for {@link EditTableCell}
 * @public
 */
export const EditTableCellBase = RecordClass(PropsType, NestedFlowOperation, DataType, propsToData);

/**
 * Properties of {@link EditTableCell}
 * @public
 */
export interface EditTableCellProps {
    /** The table position */
    position: number;

    /** The table row to edit */
    row: number;

    /** The table column to edit */
    column: number;

    /** The inner operation that shall be applied on the table cell's content */
    inner: FlowOperation;
}

/**
 * Data of {@link EditTableCell}
 * @public
 */
export interface EditTableCellData {
    /** Data discriminator */
    edit: "cell";

    /** {@inheritdoc EditTableCellProps.position} */
    at: number;

    /** {@inheritdoc EditTableCellProps.row} */
    row: number;

    /** {@inheritdoc EditTableCellProps.column} */
    column: number;

    /** {@inheritdoc EditTableCellProps.inner} */
    op: FlowOperation;
}

/**
 * Represents an operation that edit the contents of a box
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class EditTableCell extends EditTableCellBase implements EditTableCellProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => EditTableCell);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: EditTableCellData): EditTableCell {
        const { op: inner, at: position, row, column } = data;
        const props: EditTableCellProps = { inner, position, row, column };
        return new EditTableCell(props);
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (
            next instanceof EditTableCell && 
            next.position === this.position && 
            next.row == this.row && 
            next.column == this.column
        ) {
            const merged = this.inner.mergeNext(next.inner);
            if (merged !== null) {
                return this.set("inner", merged);
            }
        }
        return null;
    }

    /** 
     * {@inheritDoc NestedFlowOperation.createReplacementNode}
     */
    createReplacementNode(content: FlowContent, before: FlowNode): FlowNode {
        if (before instanceof FlowTable) {
            return before.replaceCellContent(this.row, this.column, content);
        } else {
            throw new Error("Expected a flow table to replace");
        }
    }

    /** 
     * {@inheritDoc NestedFlowOperation.getInnerContentFromNode}
     */
    getInnerContentFromNode(node: FlowNode): FlowContent {
        if (node instanceof FlowTable) {
            return node.getCellContent(this.row, this.column);
        } else {
            throw new Error(`Expected a flow table at position ${this.position}`);
        }
    }

    /** 
     * {@inheritDoc NestedFlowOperation.getInnerThemeFromNode}
     */
    getInnerThemeFromNode(node: FlowNode, outer?: FlowTheme): FlowTheme {
        if (node instanceof FlowTable) {
            const variant = node.getCellVariant(this.row, this.column);
            return (outer ?? DefaultFlowTheme.instance).getCellTheme(variant);
        } else {
            throw new Error(`Expected a flow table at position ${this.position}`);
        }
    }
}
