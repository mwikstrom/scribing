import { 
    arrayType,
    frozen, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating
} from "paratype";
import { FlowTableCell } from "./FlowTableCell";

const CellArrayType = arrayType(FlowTableCell.classType);
const FrozenCellArrayType = CellArrayType.frozen();
const Props = { cells: FrozenCellArrayType };
const PropsType: RecordType<FlowTableRowProps> = recordType(Props);
const propsToData = ({ cells }: FlowTableRowProps): FlowTableRowData => cells;

/**
 * The base record class for {@link FlowTableRow}
 * @public
 */
export const FlowTableRowBase = RecordClass(PropsType, Object, CellArrayType, propsToData);

/**
 * Properties of {@link FlowTableRow}
 * @public
 */
export interface FlowTableRowProps {
    cells: readonly FlowTableCell[];
}

/**
 * Data of {@link FlowTableRow}
 * @public
 */
export type FlowTableRowData = readonly FlowTableCell[];

/**
 * Represents a flow table row
 * @public
 * @sealed
 */
@frozen
@validating
export class FlowTableRow extends FlowTableRowBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowTableRow);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(CellArrayType) data: FlowTableRowData): FlowTableRow {
        const props: FlowTableRowProps = { cells: Object.freeze(data) };
        return new FlowTableRow(props);
    }
}
