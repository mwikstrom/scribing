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
    cols: positiveIntegerType,
    rows: positiveIntegerType,
};

const Data = {
    content: FlowContent.classType,
    cols: positiveIntegerType,
    rows: positiveIntegerType,
};

const PropsType: RecordType<FlowTableCellProps> = recordType(Props);
const DataType: RecordType<FlowTableCellData> = recordType(Data).withOptional("cols", "rows");

const propsToData = ({ content, cols, rows }: FlowTableCellProps): FlowTableCellData => {
    const result: FlowTableCellData = { content };
    if (cols !== 1) {
        result.cols = cols;
    }
    if (rows !== 1) {
        result.rows = rows;
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
    cols: number;
    rows: number;
}

/**
 * Data of {@link FlowTableCell}
 * @public
 */
export interface FlowTableCellData {
    content: FlowContent;
    cols?: number;
    rows?: number;
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
        const { content, cols = 1, rows = 1 } = data;
        return new FlowTableCell({ content, cols, rows });
    }
}
