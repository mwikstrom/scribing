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
import { InsertTableColumn } from "./InsertTableColumn";

const Props = {
    position: nonNegativeIntegerType,
    column: nonNegativeIntegerType,
    count: nonNegativeIntegerType,
};

const Data = {
    remove: constType("table_column"),
    at: Props.position,
    column: Props.column,
    count: Props.count,
};

const PropsType: RecordType<RemoveTableColumnProps> = recordType(Props);
const DataType: RecordType<RemoveTableColumnData> = recordType(Data).withOptional("count");
const propsToData = ({position, column, count }: RemoveTableColumnProps): RemoveTableColumnData => {
    const data: RemoveTableColumnData = {
        remove: "table_column",
        at: position,
        column,
    };

    if (count !== 1) {
        data.count = count;
    }
    
    return data;
};

/**
 * The base record class for {@link RemoveTableColumn}
 * @public
 */
export const RemoveTableColumnBase = RecordClass(PropsType, TableOperation, DataType, propsToData);

/**
 * Properties of {@link RemoveTableColumn}
 * @public
 */
export interface RemoveTableColumnProps {
    /** The affected flow position */
    position: number;

    /** The column index */
    column: number;

    /** The number of columns to insert */
    count: number;
}

/**
 * Data of {@link RemoveTableColumn}
 * @public
 */
export interface RemoveTableColumnData {
    /** Data discriminator */
    remove: "table_column";

    /** {@inheritdoc RemoveTableColumnProps.position} */
    at: number;

    /** {@inheritdoc RemoveTableColumnProps.column} */
    column: number;

    /** {@inheritdoc RemoveTableColumnProps.count} */
    count?: number;
}

/**
 * Represents an operation that removes a table column
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class RemoveTableColumn extends RemoveTableColumnBase implements RemoveTableColumnProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => RemoveTableColumn);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) input: RemoveTableColumnData): RemoveTableColumn {
        const { at: position, column, count = 1} = input;
        const props: RemoveTableColumnProps = { position, column, count };
        return new RemoveTableColumn(props);
    }

    /** {@inheritdoc TableOperation.invertForTable} */
    protected invertForTable(): FlowOperation | null {
        const { position, column, count } = this;
        return new InsertTableColumn({ position, column, count });
    }

    /** {@inheritdoc TableOperation.mergeNextInSameTable} */
    protected mergeNextInSameTable(): FlowOperation | null {
        return null;
    }

    /** {@inheritdoc TableOperation.transformInSameTable} */
    protected transformInSameTable(other: TableOperation): FlowOperation | null {
        return other.afterRemoveColumn(this.column, this.count);
    }

    /** {@inheritdoc TableOperation.applyToTable} */
    protected applyToTable(table: FlowTable): FlowTable {
        return table.removeColumn(this.column, this.count);
    }

    /** {@inheritdoc TableOperation.applyToCellRange} */
    protected applyToCellRange(range: CellRange, mine: boolean): CellRange | null {
        return range.afterRemoveColumn(this.column, this.count, mine);
    }
}
