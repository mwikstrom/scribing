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
import { FormatTableColumn } from "./FormatTableColumn";
import { TableColumnStyle } from "../styles/TableColumnStyle";

const Props = {
    position: nonNegativeIntegerType,
    column: nonNegativeIntegerType,
    style: TableColumnStyle.classType,
};

const Data = {
    unformat: constType("table_column"),
    column: Props.column,
    table: Props.position,
    style: Props.style,
};

const PropsType: RecordType<UnformatTableColumnProps> = recordType(Props);
const DataType: RecordType<UnformatTableColumnData> = recordType(Data);
const propsToData = ({position, column, style }: UnformatTableColumnProps): UnformatTableColumnData => ({
    unformat: "table_column",
    table: position,
    column,
    style,
});

/**
 * The base record class for {@link UnformatTableColumn}
 * @public
 */
export const UnformatTableColumnBase = RecordClass(PropsType, TableOperation, DataType, propsToData);

/**
 * Properties of {@link UnformatTableColumn}
 * @public
 */
export interface UnformatTableColumnProps {
    /** The affected flow position */
    position: number;

    /** The column index */
    column: number;

    /** The style to apply */
    style: TableColumnStyle;
}

/**
 * Data of {@link UnformatTableColumn}
 * @public
 */
export interface UnformatTableColumnData {
    /** Data discriminator */
    unformat: "table_column";

    /** {@inheritdoc UnformatTableColumnProps.position} */
    table: number;

    /** {@inheritdoc UnformatTableColumnProps.column} */
    column: number;

    /** {@inheritdoc UnformatTableColumnProps.style} */
    style: TableColumnStyle;
}

/**
 * Represents an operation that unapplies a table column style
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class UnformatTableColumn extends UnformatTableColumnBase implements UnformatTableColumnProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => UnformatTableColumn);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) input: UnformatTableColumnData): UnformatTableColumn {
        const { style, table: position, column } = input;
        const props: UnformatTableColumnProps = { style, position, column };
        return new UnformatTableColumn(props);
    }

    /** {@inheritdoc TableOperation.invertForTable} */
    protected invertForTable(): FlowOperation | null {
        const { position, style, column } = this;
        return new FormatTableColumn({ position, column, style });
    }

    /** {@inheritdoc TableOperation.mergeNextInSameTable} */
    protected mergeNextInSameTable(next: TableOperation): FlowOperation | null {
        if (next instanceof UnformatTableColumn && next.column === this.column) {
            return this.set("style", this.style.merge(next.style));
        } else {
            return null;
        }
    }

    /** {@inheritdoc TableOperation.transformInSameTable} */
    protected transformInSameTable(other: TableOperation): FlowOperation | null {
        // Formatting does not affect other operation
        return other;
    }

    /** {@inheritdoc TableOperation.applyToTable} */
    protected applyToTable(table: FlowTable): FlowTable {
        return table.unformatColumn(this.column, this.style);
    }

    /** {@inheritdoc TableOperation.applyToCellRange} */
    protected applyToCellRange(range: CellRange): CellRange | null {
        // Formatting does not affect cell range
        return range;
    }

    afterInsertColumn(index: number, count: number): TableOperation | null {
        if (this.column < index) {
            return this;
        } else {
            return this.set("column", this.column + count);
        }
    }

    afterRemoveColumn(index: number, count: number): TableOperation | null{
        if (this.column < index) {
            return this;
        } else if (this.column >= index + count) {
            return this.set("column", this.column + count);
        } else {
            return null;
        }
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
