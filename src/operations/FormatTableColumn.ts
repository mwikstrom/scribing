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
import { UnformatTableColumn } from "./UnformatTableColumn";
import { TableColumnStyle } from "../styles/TableColumnStyle";

const Props = {
    position: nonNegativeIntegerType,
    column: nonNegativeIntegerType,
    style: TableColumnStyle.classType,
};

const Data = {
    format: constType("table_column"),
    column: Props.column,
    at: Props.position,
    style: Props.style,
};

const PropsType: RecordType<FormatTableColumnProps> = recordType(Props);
const DataType: RecordType<FormatTableColumnData> = recordType(Data);
const propsToData = ({position, column, style }: FormatTableColumnProps): FormatTableColumnData => ({
    format: "table_column",
    at: position,
    column,
    style,
});

/**
 * The base record class for {@link FormatTableColumn}
 * @public
 */
export const FormatTableColumnBase = RecordClass(PropsType, TableOperation, DataType, propsToData);

/**
 * Properties of {@link FormatTableColumn}
 * @public
 */
export interface FormatTableColumnProps {
    /** The affected flow position */
    position: number;

    /** The column index */
    column: number;

    /** The style to apply */
    style: TableColumnStyle;
}

/**
 * Data of {@link FormatTableColumn}
 * @public
 */
export interface FormatTableColumnData {
    /** Data discriminator */
    format: "table_column";

    /** {@inheritdoc FormatTableColumnProps.position} */
    at: number;

    /** {@inheritdoc FormatTableColumnProps.column} */
    column: number;

    /** {@inheritdoc FormatTableColumnProps.style} */
    style: TableColumnStyle;
}

/**
 * Represents an operation that applies a table column style
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class FormatTableColumn extends FormatTableColumnBase implements FormatTableColumnProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FormatTableColumn);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) input: FormatTableColumnData): FormatTableColumn {
        const { style, at: position, column } = input;
        const props: FormatTableColumnProps = { style, position, column };
        return new FormatTableColumn(props);
    }

    /** {@inheritdoc TableOperation.invertForTable} */
    protected invertForTable(): FlowOperation | null {
        const { position, style, column } = this;
        return new UnformatTableColumn({ position, column, style });
    }

    /** {@inheritdoc TableOperation.mergeNextInSameTable} */
    protected mergeNextInSameTable(next: TableOperation): FlowOperation | null {
        if (next instanceof FormatTableColumn && next.column === this.column) {
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
        return table.formatColumn(this.column, this.style);
    }

    /** {@inheritdoc TableOperation.applyToCellRange} */
    protected applyToCellRange(range: CellRange): CellRange | null {
        // Formatting does not affect cell range
        return range;
    }
}
