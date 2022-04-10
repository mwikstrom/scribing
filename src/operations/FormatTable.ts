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
import { TableStyle } from "../styles/TableStyle";
import { TableOperation } from "./TableOperation";
import { FlowTable } from "../nodes/FlowTable";
import { CellRange } from "../selection/CellRange";
import { UnformatTable } from "./UnformatTable";

const Props = {
    position: nonNegativeIntegerType,
    style: TableStyle.classType
};

const Data = {
    format: constType("table"),
    at: Props.position,
    style: Props.style,
};

const PropsType: RecordType<FormatTableProps> = recordType(Props);
const DataType: RecordType<FormatTableData> = recordType(Data);
const propsToData = ({position, style }: FormatTableProps): FormatTableData => ({
    format: "table",
    at: position,
    style,
});

/**
 * The base record class for {@link FormatTable}
 * @public
 */
export const FormatTableBase = RecordClass(PropsType, TableOperation, DataType, propsToData);

/**
 * Properties of {@link FormatTable}
 * @public
 */
export interface FormatTableProps {
    /** The affected position */
    position: number;

    /** The style to apply */
    style: TableStyle;
}

/**
 * Data of {@link FormatTable}
 * @public
 */
export interface FormatTableData {
    /** Data discriminator */
    format: "table";

    /** {@inheritdoc FormatTableProps.position} */
    at: number;

    /** {@inheritdoc FormatTableProps.style} */
    style: TableStyle;
}

/**
 * Represents an operation that applies a table style
 * @public
 * @sealed
 */
@FlowOperationRegistry.register
export class FormatTable extends FormatTableBase implements FormatTableProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FormatTable);

    /** Gets an instance of the current class from the specified data */
    public static fromData(input: FormatTableData): FormatTable {
        const { style, at: position } = input;
        const props: FormatTableProps = { style, position };
        return new FormatTable(props);
    }

    /** {@inheritdoc TableOperation.invertForTable} */
    protected invertForTable(): FlowOperation | null {
        const { position, style } = this;
        return new UnformatTable({ position, style });
    }

    /** {@inheritdoc TableOperation.mergeNextInSameTable} */
    protected mergeNextInSameTable(next: TableOperation): FlowOperation | null {
        if (next instanceof FormatTable) {
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
        return table.set("style", table.style.merge(this.style));
    }

    /** {@inheritdoc TableOperation.applyToCellRange} */
    protected applyToCellRange(range: CellRange): CellRange | null {
        // Formatting does not affect cell range
        return range;
    }
    
    afterInsertColumn(): TableOperation | null {
        // This operation applies to the whole table, so it's unaffected
        return this;
    }

    afterRemoveColumn(): TableOperation | null{
        // This operation applies to the whole table, so it's unaffected
        return this;
    }

    afterInsertRow(): TableOperation | null{
        // This operation applies to the whole table, so it's unaffected
        return this;
    }

    afterRemoveRow(): TableOperation | null{
        // This operation applies to the whole table, so it's unaffected
        return this;
    }
}
