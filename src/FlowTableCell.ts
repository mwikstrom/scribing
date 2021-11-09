import { 
    frozen, 
    positiveIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating
} from "paratype";
import { FlowContent } from "./FlowContent";

const Props = {
    content: FlowContent.classType,
    colSpan: positiveIntegerType,
    rowSpan: positiveIntegerType,
};

const Data = Props;
const PropsType: RecordType<FlowTableCellProps> = recordType(Props);
const DataType: RecordType<FlowTableCellData> = recordType(Data).withOptional("colSpan", "rowSpan");

const propsToData = ({ content, colSpan, rowSpan }: FlowTableCellProps): FlowTableCellData => {
    const result: FlowTableCellData = { content };
    if (colSpan !== 1) {
        result.colSpan = colSpan;
    }
    if (rowSpan !== 1) {
        result.rowSpan = rowSpan;
    }
    return result;
};

/**
 * The base record class for {@link FlowTableCell}
 * @public
 */
export const FlowTableCellBase = RecordClass(PropsType, Object, DataType, propsToData);

/**
 * Properties of {@link FlowTableCell}
 * @public
 */
export interface FlowTableCellProps {
    content: FlowContent;
    colSpan: number;
    rowSpan: number;
}

/**
 * Data of {@link FlowTableCell}
 * @public
 */
export interface FlowTableCellData {
    content: FlowContent;
    colSpan?: number;
    rowSpan?: number;
}

/**
 * Represents a flow table cell
 * @public
 * @sealed
 */
@frozen
@validating
export class FlowTableCell extends FlowTableCellBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowTableCell);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowTableCellData): FlowTableCell {
        const { content, colSpan = 1, rowSpan = 1 } = data;
        return new FlowTableCell({ content, colSpan, rowSpan });
    }
}
