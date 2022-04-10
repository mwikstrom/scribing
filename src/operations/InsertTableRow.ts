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
import { RemoveTableRow } from "./RemoveTableRow";
import { insertionAfterInsertion, insertionAfterRemoval } from "../internal/transform-helpers";

const Props = {
    position: nonNegativeIntegerType,
    row: nonNegativeIntegerType,
    count: nonNegativeIntegerType,
};

const Data = {
    insert: constType("table_row"),
    table: Props.position,
    row: Props.row,
    count: Props.count,
};

const PropsType: RecordType<InsertTableRowProps> = recordType(Props);
const DataType: RecordType<InsertTableRowData> = recordType(Data).withOptional("count");
const propsToData = ({position, row, count }: InsertTableRowProps): InsertTableRowData => {
    const data: InsertTableRowData = {
        insert: "table_row",
        table: position,
        row,
    };

    if (count !== 1) {
        data.count = count;
    }
    
    return data;
};

/**
 * The base record class for {@link InsertTableRow}
 * @public
 */
export const InsertTableRowBase = RecordClass(PropsType, TableOperation, DataType, propsToData);

/**
 * Properties of {@link InsertTableRow}
 * @public
 */
export interface InsertTableRowProps {
    /** The affected flow position */
    position: number;

    /** The row index */
    row: number;

    /** The number of rows to insert */
    count: number;
}

/**
 * Data of {@link InsertTableRow}
 * @public
 */
export interface InsertTableRowData {
    /** Data discriminator */
    insert: "table_row";

    /** {@inheritdoc InsertTableRowProps.position} */
    table: number;

    /** {@inheritdoc InsertTableRowProps.row} */
    row: number;

    /** {@inheritdoc InsertTableRowProps.count} */
    count?: number;
}

/**
 * Represents an operation that inserts a table row
 * @public
 * @sealed
 */
@FlowOperationRegistry.register
export class InsertTableRow extends InsertTableRowBase implements InsertTableRowProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => InsertTableRow);

    /** Gets an instance of the current class from the specified data */
    public static fromData(input: InsertTableRowData): InsertTableRow {
        const { table: position, row, count = 1} = input;
        const props: InsertTableRowProps = { position, row, count };
        return new InsertTableRow(props);
    }

    /** {@inheritdoc TableOperation.invertForTable} */
    protected invertForTable(): FlowOperation | null {
        const { position, row, count } = this;
        return new RemoveTableRow({ position, row, count });
    }

    /** {@inheritdoc TableOperation.mergeNextInSameTable} */
    protected mergeNextInSameTable(): FlowOperation | null {
        return null;
    }

    /** {@inheritdoc TableOperation.transformInSameTable} */
    protected transformInSameTable(other: TableOperation): FlowOperation | null {
        return other.afterInsertRow(this.row, this.count);
    }

    /** {@inheritdoc TableOperation.applyToTable} */
    protected applyToTable(table: FlowTable): FlowTable {
        return table.insertRow(this.row, this.count);
    }

    /** {@inheritdoc TableOperation.applyToCellRange} */
    protected applyToCellRange(range: CellRange): CellRange | null {
        return range.afterInsertRow(this.row, this.count);
    }

    afterInsertColumn(): TableOperation | null {
        // This operation applies to all columns, so it's unaffected
        return this;
    }

    afterRemoveColumn(): TableOperation | null{
        // This operation applies to all rows, so it's unaffected
        return this;
    }

    afterInsertRow(index: number, count: number): TableOperation | null {
        return insertionAfterInsertion(this, "row", index, count);
    }

    afterRemoveRow(index: number, count: number): TableOperation | null {
        return insertionAfterRemoval(this, "row", index, count);
    }
}
