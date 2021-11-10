import { 
    frozen, 
    positiveIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    Type, 
    type, 
    unionType, 
    validating
} from "paratype";
import { CellPosition } from "../selection/CellPosition";
import { FlowContent } from "./FlowContent";

const Props = {
    content: FlowContent.classType,
    colSpan: positiveIntegerType,
    rowSpan: positiveIntegerType,
};

const PropsType: RecordType<FlowTableCellProps> = recordType(Props);
const DataType: Type<FlowTableCellData> = unionType(
    recordType(Props).withOptional("colSpan", "rowSpan"),
    FlowContent.classType
);

const propsToData = ({ content, colSpan, rowSpan }: FlowTableCellProps): FlowTableCellData => {
    if (colSpan === 1 && rowSpan === 1) {
        return content;
    } else {
        const record: FlowTableCellData = { content };
        if (colSpan !== 1) {
            record.colSpan = colSpan;
        }
        if (rowSpan !== 1) {
            record.rowSpan = rowSpan;
        }
        return record;
    }
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
export type FlowTableCellData = FlowContent | {
    content: FlowContent;
    colSpan?: number;
    rowSpan?: number;
};

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
        const record = FlowContent.classType.test(data) ? { content: data } : data;
        const { content, colSpan = 1, rowSpan = 1 } = record;
        return new FlowTableCell({ content, colSpan, rowSpan });
    }

    public getSpannedPositions(root: CellPosition, includeSelf?: boolean): CellPosition[] {
        const { row: rootRow, column: rootColumn } = root;
        const { rowSpan, colSpan } = this;
        const result = new Array<CellPosition>(rowSpan * colSpan - (includeSelf ? 0 : 1));
        for (let r = 0; r < rowSpan; ++r) {
            for (let c = (r || includeSelf) ? 0 : 1; c < colSpan; ++c) {
                const row = rootRow + r;
                const column = rootColumn + c;
                result[r * colSpan + c - 1] = CellPosition.at(row, column);
            }
        }
        return result;
    }
}
