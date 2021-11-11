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
import { FlowOperation } from "./FlowOperation";
import { FlowOperationRegistry } from "../internal/class-registry";
import { TableOperation } from "./TableOperation";
import { FlowTable } from "../nodes/FlowTable";
import { CellRange } from "../selection/CellRange";
import { CellPosition } from "../selection/CellPosition";
import { SplitTableCell } from "./SplitTableCell";
import { getRangeAfterInsertion, getRangeAfterRemoval } from "../internal/transform-helpers";
import { FlowRange } from "..";

const Props = {
    position: nonNegativeIntegerType,
    cell: CellPosition.classType,
    colSpan: nonNegativeIntegerType,
    rowSpan: nonNegativeIntegerType,
};

const Data = {
    merge: constType("table_cell"),
    table: Props.position,
    cell: Props.cell,
    colSpan: Props.colSpan,
    rowSpan: Props.rowSpan,
};

const PropsType: RecordType<MergeTableCellProps> = recordType(Props);
const DataType: RecordType<MergeTableCellData> = recordType(Data);
const propsToData = ({position, ...rest }: MergeTableCellProps): MergeTableCellData => ({
    merge: "table_cell",
    table: position,
    ...rest,
});

/**
 * The base record class for {@link MergeTableCell}
 * @public
 */
export const MergeTableCellBase = RecordClass(PropsType, TableOperation, DataType, propsToData);

/**
 * Properties of {@link MergeTableCell}
 * @public
 */
export interface MergeTableCellProps {
    /** The affected table's flow position */
    position: number;

    /** The affected cell */
    cell: CellPosition;

    /** The number of columns to span */
    colSpan: number;

    /** The number of rows to span */
    rowSpan: number;
}

/**
 * Data of {@link MergeTableCell}
 * @public
 */
export interface MergeTableCellData {
    /** Data discriminator */
    merge: "table_cell";

    /** {@inheritdoc MergeTableCellProps.position} */
    table: number;

    /** {@inheritdoc MergeTableCellProps.cell} */
    cell: CellPosition;

    /** {@inheritdoc MergeTableCellProps.colSpan} */
    colSpan: number;

    /** {@inheritdoc MergeTableCellProps.rowSpan} */
    rowSpan: number;
}

/**
 * Represents an operation that merges a range of table cells into one
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class MergeTableCell extends MergeTableCellBase implements MergeTableCellProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => MergeTableCell);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) input: MergeTableCellData): MergeTableCell {
        const { table: position, ...rest } = input;
        const props: MergeTableCellProps = { position, ...rest };
        return new MergeTableCell(props);
    }

    /** {@inheritdoc TableOperation.invertForTable} */
    protected invertForTable(): FlowOperation | null {
        const { position, cell } = this;
        return new SplitTableCell({ position, cell });
    }

    /** {@inheritdoc TableOperation.mergeNextInSameTable} */
    protected mergeNextInSameTable(): FlowOperation | null {
        return null;
    }

    /** {@inheritdoc TableOperation.transformInSameTable} */
    protected transformInSameTable(other: TableOperation): FlowOperation | null {
        // TODO: Maybe we should transform other merge/split?!
        return other;
    }

    /** {@inheritdoc TableOperation.applyToTable} */
    protected applyToTable(table: FlowTable): FlowTable {
        return table.set("content", table.content.merge(this.cell, this.colSpan, this.rowSpan));
    }

    /** {@inheritdoc TableOperation.applyToCellRange} */
    protected applyToCellRange(range: CellRange): CellRange | null {
        // merging doesn't affect cell range
        return range;
    }

    afterInsertColumn(index: number, count: number): TableOperation | null {
        return this.afterInsertAxis("column", index, count);
    }

    afterRemoveColumn(index: number, count: number): TableOperation | null {
        return this.afterRemoveAxis("column", index, count);
    }

    afterInsertRow(index: number, count: number): TableOperation | null {
        return this.afterInsertAxis("row", index, count);
    }

    afterRemoveRow(index: number, count: number): TableOperation | null {
        return this.afterRemoveAxis("row", index, count);
    }

    afterInsertAxis(axis: "row" | "column", index: number, count: number): TableOperation | null {
        const before = this.getAxisRange(axis);
        const after = getRangeAfterInsertion(before, FlowRange.at(index, count), true);
        return this.setAxisRange(axis, after);
    }

    afterRemoveAxis(axis: "row" | "column", index: number, count: number): TableOperation | null {
        const before = this.getAxisRange(axis);
        const after = getRangeAfterRemoval(before, FlowRange.at(index, count));
        return this.setAxisRange(axis, after);
    }

    getAxisRange(axis: "row" | "column"): FlowRange {
        return FlowRange.at(this.cell[axis], this[getAxisSpan(axis)]);
    }    

    setAxisRange(axis: "row" | "column", range: FlowRange | null): TableOperation | null {
        if (range === null || range.size <= 1) {
            return null;
        } else {
            return this.merge({
                cell: this.cell.set(axis, range.first),
                [getAxisSpan(axis)]: range.size,
            });
        }
    }
}

const getAxisSpan = (axis: "row" | "column"): "rowSpan" | "colSpan" => axis === "column" ? "colSpan" : `${axis}Span`;
