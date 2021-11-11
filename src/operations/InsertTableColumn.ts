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
import { RemoveTableColumn } from "./RemoveTableColumn";
import { insertionAfterInsertion, insertionAfterRemoval } from "../internal/transform-helpers";

const Props = {
    position: nonNegativeIntegerType,
    column: nonNegativeIntegerType,
    count: nonNegativeIntegerType,
};

const Data = {
    insert: constType("table_column"),
    table: Props.position,
    column: Props.column,
    count: Props.count,
};

const PropsType: RecordType<InsertTableColumnProps> = recordType(Props);
const DataType: RecordType<InsertTableColumnData> = recordType(Data).withOptional("count");
const propsToData = ({position, column, count }: InsertTableColumnProps): InsertTableColumnData => {
    const data: InsertTableColumnData = {
        insert: "table_column",
        table: position,
        column,
    };

    if (count !== 1) {
        data.count = count;
    }
    
    return data;
};

/**
 * The base record class for {@link InsertTableColumn}
 * @public
 */
export const InsertTableColumnBase = RecordClass(PropsType, TableOperation, DataType, propsToData);

/**
 * Properties of {@link InsertTableColumn}
 * @public
 */
export interface InsertTableColumnProps {
    /** The affected flow position */
    position: number;

    /** The column index */
    column: number;

    /** The number of columns to insert */
    count: number;
}

/**
 * Data of {@link InsertTableColumn}
 * @public
 */
export interface InsertTableColumnData {
    /** Data discriminator */
    insert: "table_column";

    /** {@inheritdoc InsertTableColumnProps.position} */
    table: number;

    /** {@inheritdoc InsertTableColumnProps.column} */
    column: number;

    /** {@inheritdoc InsertTableColumnProps.count} */
    count?: number;
}

/**
 * Represents an operation that inserts a table column
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class InsertTableColumn extends InsertTableColumnBase implements InsertTableColumnProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => InsertTableColumn);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) input: InsertTableColumnData): InsertTableColumn {
        const { table: position, column, count = 1} = input;
        const props: InsertTableColumnProps = { position, column, count };
        return new InsertTableColumn(props);
    }

    /** {@inheritdoc TableOperation.invertForTable} */
    protected invertForTable(): FlowOperation | null {
        const { position, column, count } = this;
        return new RemoveTableColumn({ position, column, count });
    }

    /** {@inheritdoc TableOperation.mergeNextInSameTable} */
    protected mergeNextInSameTable(): FlowOperation | null {
        return null;
    }

    /** {@inheritdoc TableOperation.transformInSameTable} */
    protected transformInSameTable(other: TableOperation): FlowOperation | null {
        return other.afterInsertColumn(this.column, this.count);
    }

    /** {@inheritdoc TableOperation.applyToTable} */
    protected applyToTable(table: FlowTable): FlowTable {
        return table.insertColumn(this.column, this.count);
    }

    /** {@inheritdoc TableOperation.applyToCellRange} */
    protected applyToCellRange(range: CellRange): CellRange | null {
        return range.afterInsertColumn(this.column, this.count);
    }

    afterInsertColumn(index: number, count: number): TableOperation | null {
        return insertionAfterInsertion(this, "column", index, count);
    }

    afterRemoveColumn(index: number, count: number): TableOperation | null{
        return insertionAfterRemoval(this, "column", index, count);
    }

    afterInsertRow(): TableOperation | null{
        // This operation applies to all rows, so it's unaffected
        return this;
    }

    afterRemoveRow(): TableOperation | null{
        // This operation applies to all rows, so it's unaffected
        return this;
    }
}
