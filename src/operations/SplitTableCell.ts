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
import { MergeTableCell } from "./MergeTableCell";

const Props = {
    position: nonNegativeIntegerType,
    cell: CellPosition.classType,
};

const Data = {
    split: constType("table_cell"),
    table: Props.position,
    cell: Props.cell,
};

const PropsType: RecordType<SplitTableCellProps> = recordType(Props);
const DataType: RecordType<SplitTableCellData> = recordType(Data);
const propsToData = ({position, ...rest }: SplitTableCellProps): SplitTableCellData => ({
    split: "table_cell",
    table: position,
    ...rest,
});

/**
 * The base record class for {@link SplitTableCell}
 * @public
 */
export const SplitTableCellBase = RecordClass(PropsType, TableOperation, DataType, propsToData);

/**
 * Properties of {@link SplitTableCell}
 * @public
 */
export interface SplitTableCellProps {
    /** The affected table's flow position */
    position: number;

    /** The affected cell */
    cell: CellPosition;
}

/**
 * Data of {@link SplitTableCell}
 * @public
 */
export interface SplitTableCellData {
    /** Data discriminator */
    split: "table_cell";

    /** {@inheritdoc SplitTableCellProps.position} */
    table: number;

    /** {@inheritdoc SplitTableCellProps.cell} */
    cell: CellPosition;
}

/**
 * Represents an operation that splits a merged table cell
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class SplitTableCell extends SplitTableCellBase implements SplitTableCellProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => SplitTableCell);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) input: SplitTableCellData): SplitTableCell {
        const { table: position, ...rest } = input;
        const props: SplitTableCellProps = { position, ...rest };
        return new SplitTableCell(props);
    }

    /** {@inheritdoc TableOperation.invertForTable} */
    protected invertForTable(table: FlowTable): FlowOperation | null {
        const { position, cell } = this;
        const { colSpan, rowSpan } = table.content.getCell(cell, true);
        return new MergeTableCell({ position, cell, colSpan, rowSpan });
    }

    /** {@inheritdoc TableOperation.splitNextInSameTable} */
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
        return table.set("content", table.content.split(this.cell));
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
        if (index > this.cell[axis]) {
            // insertion after cell
            return this;
        } else {
            // insertion before or at cell
            return this.set("cell", this.cell.set(axis, this.cell[axis] + count));
        }
    }

    afterRemoveAxis(axis: "row" | "column", index: number, count: number): TableOperation | null {
        if (index > this.cell[axis]) {
            // removal after cell
            return this;
        } else if (index + count < this.cell[axis]) {
            // removal before cell
            return this.set("cell", this.cell.set(axis, this.cell[axis] - count));
        } else {
            // cell was removed
            return null;
        }
    }
}
