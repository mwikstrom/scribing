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
import { TableStyle } from "../styles/TableStyle";
import { TableOperation } from "./TableOperation";
import { FlowTable } from "../nodes/FlowTable";
import { CellRange } from "../selection/CellRange";
import { FormatTable } from "./FormatTable";

const Props = {
    position: nonNegativeIntegerType,
    style: TableStyle.classType
};

const Data = {
    unformat: constType("table"),
    at: Props.position,
    style: Props.style,
};

const PropsType: RecordType<UnformatTableProps> = recordType(Props);
const DataType: RecordType<UnformatTableData> = recordType(Data);
const propsToData = ({position, style }: UnformatTableProps): UnformatTableData => ({
    unformat: "table",
    at: position,
    style,
});

/**
 * The base record class for {@link UnformatTable}
 * @public
 */
export const UnformatTableBase = RecordClass(PropsType, TableOperation, DataType, propsToData);

/**
 * Properties of {@link UnformatTable}
 * @public
 */
export interface UnformatTableProps {
    /** The affected position */
    position: number;

    /** The style to unapply */
    style: TableStyle;
}

/**
 * Data of {@link UnformatTable}
 * @public
 */
export interface UnformatTableData {
    /** Data discriminator */
    unformat: "table";

    /** {@inheritdoc UnformatTableProps.position} */
    at: number;

    /** {@inheritdoc UnformatTableProps.style} */
    style: TableStyle;
}

/**
 * Represents an operation that unapplies a table style
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class UnformatTable extends UnformatTableBase implements UnformatTableProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => UnformatTable);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) input: UnformatTableData): UnformatTable {
        const { style, at: position } = input;
        const props: UnformatTableProps = { style, position };
        return new UnformatTable(props);
    }

    /** {@inheritdoc TableOperation.invertForTable} */
    protected invertForTable(): FlowOperation | null {
        const { position, style } = this;
        return new FormatTable({ position, style });
    }

    /** {@inheritdoc TableOperation.mergeNextInSameTable} */
    protected mergeNextInSameTable(next: TableOperation): FlowOperation | null {
        if (next instanceof UnformatTable) {
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
        return table.set("style", table.style.unmerge(this.style));
    }

    /** {@inheritdoc TableOperation.applyToCellRange} */
    protected applyToCellRange(range: CellRange): CellRange | null {
        // Formatting does not affect cell range
        return range;
    }
}
