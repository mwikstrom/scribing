import { 
    constType,
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
} from "paratype";
import { FlowOperation } from "./FlowOperation";
import { FlowOperationRegistry } from "../internal/class-registry";
import { TableOperation } from "./TableOperation";
import { FlowTable } from "../nodes/FlowTable";
import { CellRange } from "../selection/CellRange";
import { InsertTableRow } from "./InsertTableRow";
import { removalAfterInsertion, removalAfterRemoval } from "../internal/transform-helpers";

const Props = {
    position: nonNegativeIntegerType,
    row: nonNegativeIntegerType,
    count: nonNegativeIntegerType,
};

const Data = {
    remove: constType("table_row"),
    table: Props.position,
    row: Props.row,
    count: Props.count,
};

const PropsType: RecordType<RemoveTableRowProps> = recordType(Props);
const DataType: RecordType<RemoveTableRowData> = recordType(Data).withOptional("count");
const propsToData = ({position, row, count }: RemoveTableRowProps): RemoveTableRowData => {
    const data: RemoveTableRowData = {
        remove: "table_row",
        table: position,
        row,
    };

    if (count !== 1) {
        data.count = count;
    }
    
    return data;
};

/**
 * The base record class for {@link RemoveTableRow}
 * @public
 */
export const RemoveTableRowBase = RecordClass(PropsType, TableOperation, DataType, propsToData);

/**
 * Properties of {@link RemoveTableRow}
 * @public
 */
export interface RemoveTableRowProps {
    /** The affected flow position */
    position: number;

    /** The row index */
    row: number;

    /** The number of rows to insert */
    count: number;
}

/**
 * Data of {@link RemoveTableRow}
 * @public
 */
export interface RemoveTableRowData {
    /** Data discriminator */
    remove: "table_row";

    /** {@inheritdoc RemoveTableRowProps.position} */
    table: number;

    /** {@inheritdoc RemoveTableRowProps.row} */
    row: number;

    /** {@inheritdoc RemoveTableRowProps.count} */
    count?: number;
}

/**
 * Represents an operation that removes a table row
 * @public
 * @sealed
 */
@FlowOperationRegistry.register
export class RemoveTableRow extends RemoveTableRowBase implements RemoveTableRowProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => RemoveTableRow);

    /** Gets an instance of the current class from the specified data */
    public static fromData(input: RemoveTableRowData): RemoveTableRow {
        const { table: position, row, count = 1} = input;
        const props: RemoveTableRowProps = { position, row, count };
        return new RemoveTableRow(props);
    }

    /** {@inheritdoc TableOperation.invertForTable} */
    protected invertForTable(): FlowOperation | null {
        const { position, row, count } = this;
        return new InsertTableRow({ position, row, count });
    }

    /** {@inheritdoc TableOperation.mergeNextInSameTable} */
    protected mergeNextInSameTable(): FlowOperation | null {
        return null;
    }

    /** {@inheritdoc TableOperation.transformInSameTable} */
    protected transformInSameTable(other: TableOperation): FlowOperation | null {
        return other.afterRemoveRow(this.row, this.count);
    }

    /** {@inheritdoc TableOperation.applyToTable} */
    protected applyToTable(table: FlowTable): FlowTable {
        return table.removeRow(this.row, this.count);
    }

    /** {@inheritdoc TableOperation.applyToCellRange} */
    protected applyToCellRange(range: CellRange): CellRange | null {
        return range.afterRemoveRow(this.row, this.count);
    }
    afterInsertColumn(): TableOperation | null {
        // This operation applies to all columns, so it's unaffected
        return this;
    }

    afterRemoveColumn(): TableOperation | null{
        // This operation applies to all rows, so it's unaffected
        return this;
    }

    afterInsertRow(index: number, count: number): TableOperation | null{
        return removalAfterInsertion(this, "row", index, count);
    }

    afterRemoveRow(index: number, count: number): TableOperation | null{
        return removalAfterRemoval(this, "row", index, count);
    }
}
