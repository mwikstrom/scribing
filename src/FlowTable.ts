import { 
    arrayType,
    frozen, 
    mapType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating
} from "paratype";
import { CellPosition, DefaultFlowTheme, FlowContent } from ".";
import { BoxStyle } from "./BoxStyle";
import { FlowNode } from "./FlowNode";
import { FlowRange } from "./FlowRange";
import { FlowRangeSelection } from "./FlowRangeSelection";
import { FlowTableCell } from "./FlowTableCell";
import { FlowTableRow } from "./FlowTableRow";
import { FlowTheme } from "./FlowTheme";
import { FlowNodeRegistry } from "./internal/class-registry";
import { ParagraphStyle, ParagraphStyleProps } from "./ParagraphStyle";
import { ParagraphTheme } from "./ParagraphTheme";
import { TableColumnStyle } from "./TableColumnStyle";
import { TableStyle } from "./TableStyle";
import { TextStyle, TextStyleProps } from "./TextStyle";

const RowArrayType = arrayType(FlowTableRow.classType);
const ColumnStyleArrayType = arrayType(TableColumnStyle.classType);
const FrozenRowArrayType = RowArrayType.frozen();
const FrozenColumnStyleArrayType = ColumnStyleArrayType.frozen();

const Props = {
    rows: FrozenRowArrayType,
    columns: FrozenColumnStyleArrayType,
    style: TableStyle.classType,
};

const Data = {
    table: RowArrayType,
    columns: mapType(TableColumnStyle.classType),
    style: TableStyle.classType,
};

const PropsType: RecordType<FlowTableProps> = recordType(Props);
const DataType: RecordType<FlowTableData> = recordType(Data).withOptional("columns", "style");

const propsToData = ({ rows, columns: columnArray, style }: FlowTableProps): FlowTableData  => {
    const data: FlowTableData = { table: [...rows] };
    const columns = new Map<string, TableColumnStyle>();

    for (let i = 0; i < columnArray.length; ++i) {
        const style = columnArray[i];
        if (!style.isEmpty) {
            columns.set(i.toString(10), style);
        }
    }

    if (columns.size > 0) {
        data.columns = columns;
    }

    if (!style.isEmpty) {
        data.style = style;
    }

    return data;
};

/**
 * The base record class for {@link FlowTable}
 * @public
 */
export const FlowTableBase = RecordClass(PropsType, FlowNode, DataType, propsToData);

/**
 * Properties of {@link FlowTable}
 * @public
 */
export interface FlowTableProps {
    rows: readonly FlowTableRow[];
    columns: readonly TableColumnStyle[];
    style: TableStyle;
}

/**
 * Data of {@link FlowTable}
 * @public
 */
export interface FlowTableData {
    table: FlowTableRow[];
    columns?: Map<string, TableColumnStyle>;
    style?: TableStyle;
}

const MAX_ROWS = 1000;
const MAX_COLUMNS = 100;

/** @public */
export type TableRowGroup = typeof TABLE_ROW_GROUPS[number];

/** @public */
export const TABLE_ROW_GROUPS = Object.freeze(["header", "body", "footer"] as const);

/** @public */
export type TableColumnGroup = typeof TABLE_COLUMN_GROUPS[number];

/** @public */
export const TABLE_COLUMN_GROUPS = Object.freeze(["start", "body", "end"] as const);

/** @public */
export type TableCellVariant = typeof TABLE_CELL_VARIANTS[number];

/** @public */
export const TABLE_CELL_VARIANTS = Object.freeze([
    "header", 
    "header-start-column",
    "header-end-column",
    "body", 
    "body-start-column",
    "body-end-column", 
    "footer",
    "footer-start-column",
    "footer-end-column",
] as const);

/**
 * Represents a flow table cell
 * @public
 * @sealed
 */
@frozen
@validating
@FlowNodeRegistry.register
export class FlowTable extends FlowTableBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowTable);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    readonly #headerRowCount: number;   
    readonly #bodyRowCount: number; 
    readonly #footerRowCount: number;
    readonly #startHeaderColumnCount: number;
    readonly #bodyColumnCount: number;
    readonly #endHeaderColumnCount: number;
    readonly #mappingByTableIndex: readonly CellMapping[];

    constructor(props: FlowTableProps) {
        super(props);

        const columnCount = this.columns.length;
        const rowCount = this.rows.length;

        if (columnCount < 1) {
            throw new RangeError("Flow table must have at least one column");
        } else if (columnCount > MAX_COLUMNS) {
            throw new RangeError(`Flow table cannot have more than ${MAX_COLUMNS} columns`);
        }

        if (rowCount < 1) {
            throw new RangeError("Flow table must have at least one row");
        } else if (rowCount > MAX_ROWS) {
            throw new RangeError(`Flow table cannot have more than ${MAX_ROWS} rows`);
        }

        const { 
            headerRows: styledHeadRows = 0, 
            footerRows: styledFootRows = 0, 
            startHeaderColumns: styledStartCols = 0, 
            endHeaderColumns: styledEndCols = 0
        } = this.style;

        this.#headerRowCount = Math.max(0, Math.min(rowCount, styledHeadRows));
        this.#footerRowCount = Math.max(0, Math.min(rowCount - this.#headerRowCount, styledFootRows));
        this.#bodyRowCount = rowCount - this.#headerRowCount - this.#footerRowCount;
        this.#startHeaderColumnCount = Math.max(0, Math.min(columnCount, styledStartCols));
        this.#endHeaderColumnCount = Math.max(0, Math.min(columnCount - this.#startHeaderColumnCount, styledEndCols));
        this.#bodyColumnCount = columnCount - this.#startHeaderColumnCount - this.#endHeaderColumnCount;

        const straddlingColumns = new Array<number>(columnCount).fill(0);
        const cellCount = rowCount * columnCount;
        const mappingByTableIndex = new Array<CellMapping>(cellCount);

        let rowIndex = 0;
        for (const group of TABLE_ROW_GROUPS) {
            for (const { cells: cellsOnRow } of this.getRows(group)) {
                processTableRow(rowIndex, cellsOnRow, straddlingColumns, mappingByTableIndex);
                ++rowIndex;
                if (straddlingColumns.every(value => value > 0)) {
                    throw new RangeError(`Flow table row #${rowIndex} consists of straddling cells only`);
                }
            }

            if (straddlingColumns.some(value => value > 0)) {
                throw new RangeError(`Flow table ${group} has overflowing straddling cells`);
            }
        }

        this.#mappingByTableIndex = mappingByTableIndex;
    }    

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowTableData): FlowTable {
        const { table: rows, columns: columnMap, style = TableStyle.empty } = data;
        const cellsOnFirstRow = rows[0]?.cells ?? [];
        const columnCount = cellsOnFirstRow.reduce((prev, curr) => prev + curr.colSpan, 0);
        const columnStyles = new Array<TableColumnStyle>(columnCount).fill(TableColumnStyle.empty);

        if (columnMap) {
            for (const [key, value] of columnMap.entries()) {
                let index: number;
                if (!/^[0-9]+$/.test(key) || (index = parseInt(key, 10)) < 0 || index >= columnCount) {
                    throw new RangeError(
                        `Table column style has invalid key: '${key}' (Column count is ${columnCount})`
                    );
                }
                columnStyles[index] = value;
            }
        }

        return new FlowTable({ rows, columns: columnStyles, style });
    }

    public getColumnStartIndex(group?: TableColumnGroup): number {
        if (group === "body") {
            return this.#startHeaderColumnCount;
        } else if (group === "end") {
            return this.#startHeaderColumnCount + this.#bodyColumnCount;
        } else {
            return 0;
        }
    }

    public getColumnCount(group?: TableColumnGroup): number {
        if (group === void(0)) {
            return this.columns.length;
        } else if (group === "start") {
            return this.#startHeaderColumnCount;
        } else if (group === "body") {
            return this.#bodyColumnCount;
        } else if (group === "end") {
            return this.#endHeaderColumnCount;
        } else {
            return 0;
        }
    }

    public getRowStartIndex(group?: TableRowGroup): number {
        if (group === "body") {
            return this.#headerRowCount;
        } else if (group === "footer") {
            return this.#headerRowCount + this.#bodyRowCount;
        } else {
            return 0;
        }
    }

    public getRowCount(group?: TableRowGroup): number {
        if (group === void(0)) {
            return this.rows.length;
        } else if (group === "header") {
            return this.#headerRowCount;
        } else if (group === "body") {
            return this.#bodyRowCount;
        } else if (group === "footer") {
            return this.#footerRowCount;
        } else {
            return 0;
        }
    }

    public *getRows(group?: TableRowGroup): Iterable<FlowTableRow> {
        const startIndex = this.getRowStartIndex(group);
        const endIndex = startIndex + this.getRowCount(group);
        const { rows } = this;
        for (let i = startIndex; i < endIndex; ++i) {
            yield rows[i];
        }
    }

    public getRowIndex(row: number, column: number): number {
        const tableIndex = this.#getTableIndex(row, column);
        return this.#mappingByTableIndex[tableIndex].rowIndex;
    }

    public getColumnIndex(row: number, column: number): number {
        const tableIndex = this.#getTableIndex(row, column);
        return this.#mappingByTableIndex[tableIndex].columnIndex;
    }

    public getRowCellIndex(row: number, column: number): number {
        const tableIndex = this.#getTableIndex(row, column);
        return this.#mappingByTableIndex[tableIndex].rowCellIndex;
    }    

    public getRow(row: number, column: number): FlowTableRow | null {
        const rowIndex = this.getRowIndex(row, column);
        return this.rows[rowIndex] ?? null;
    }

    public getRowGroup(row: number, column: number): TableRowGroup {
        const rowIndex = this.getRowIndex(row, column);
        if (rowIndex < this.getRowStartIndex("body")) {
            return "header";
        } else if (rowIndex >= this.getRowStartIndex("footer")) {
            return "footer";
        } else {
            return "body";
        }
    }

    public getColumnGroup(row: number, column: number): TableColumnGroup {
        const columnIndex = this.getColumnIndex(row, column);
        if (columnIndex < this.getColumnStartIndex("body")) {
            return "start";
        } else if (columnIndex >= this.getColumnStartIndex("end")) {
            return "end";
        } else {
            return "body";
        }
    }

    public getCell(row: number, column: number): FlowTableCell | null {
        const rowObj = this.getRow(row, column);
        const cellIndex = this.getRowCellIndex(row, column);
        return rowObj?.cells[cellIndex] ?? null;
    }

    public getCellVariant(position: CellPosition): TableCellVariant {
        const { row, column } = position;
        const rowGroup = this.getRowGroup(row, column);
        const colGroup = this.getColumnGroup(row, column);

        if (colGroup === "body") {
            return rowGroup;
        } else {
            return `${rowGroup}-${colGroup}-column`;
        }
    }

    public getCellTheme(row: number, column: number, outer?: FlowTheme): FlowTheme {
        const variant = this.getCellVariant(new CellPosition({row, column}));
        return (outer ?? DefaultFlowTheme.instance).getCellTheme(variant);
    }

    public getCellContent(position: CellPosition): FlowContent {
        // TODO: IMPLEMENT. HANDLE MERGED CONTENT?!
        throw new Error("NOT IMPLEMENTED");
    }

    public replaceCellContent(position: CellPosition, newContent: FlowContent): this {
        // TODO: IMPLEMENT. HANDLE MERGED CONTENT?!
        throw new Error("NOT IMPLEMENTED");
    }

    /** {@inheritdoc FlowNode.completeUpload} */
    completeUpload(id: string, url: string): FlowNode {
        return this.#updateAllContent(content => content.completeUpload(id, url));
    }

    /** {@inheritdoc FlowNode.formatBox} */
    public formatBox(style: BoxStyle, theme?: FlowTheme): this {
        return this.#updateAllContent((content, row, column) => 
            content.formatBox(FlowRange.at(0, content.size), style, this.getCellTheme(row, column, theme))
        );
    }

    /** {@inheritdoc FlowNode.formatText} */
    public formatText(style: TextStyle, theme?: FlowTheme): this {
        return this.#updateAllContent((content, row, column) => 
            content.formatText(FlowRange.at(0, content.size), style, this.getCellTheme(row, column, theme))
        );
    }

    /** {@inheritdoc FlowNode.formatParagraph} */
    public formatParagraph(style: ParagraphStyle, theme?: FlowTheme): this {
        return this.#updateAllContent((content, row, column) => 
            content.formatParagraph(FlowRange.at(0, content.size), style, this.getCellTheme(row, column, theme))
        );
    }

    /**
     * {@inheritDoc FlowNode.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(
        theme?: ParagraphTheme,
        diff: Set<keyof ParagraphStyleProps> = new Set(),
    ): ParagraphStyle | null {
        let result = ParagraphStyle.empty;
        this.#visitAllContent((content, row, column) => {
            const range = FlowRange.at(0, content.size);
            const selection = new FlowRangeSelection({ range });
            const innerTheme =  this.getCellTheme(row, column, theme?.getFlowTheme());
            const uniform = selection.getUniformParagraphStyle(content, innerTheme, diff);
            result = result.merge(uniform, diff);
        });
        return result;
    }

    /**
     * {@inheritDoc FlowNode.getUniformTextStyle}
     * @override
     */
    public getUniformTextStyle(
        theme?: ParagraphTheme,
        diff: Set<keyof TextStyleProps> = new Set(),
    ): TextStyle {
        let result = TextStyle.empty;
        this.#visitAllContent((content, row, column) => {
            const range = FlowRange.at(0, content.size);
            const selection = new FlowRangeSelection({ range });
            const innerTheme =  this.getCellTheme(row, column, theme?.getFlowTheme());
            const uniform = selection.getUniformTextStyle(content, innerTheme, diff);
            result = result.merge(uniform, diff);
        });
        return result;
    }

    /** {@inheritdoc FlowNode.unformatAmbient} */
    public unformatAmbient(theme: ParagraphTheme): this {
        return this.#updateAllContent((content, row, column) => 
            content.unformatAmbient(this.getCellTheme(row, column, theme?.getFlowTheme()))
        );
    }

    /** {@inheritdoc FlowNode.unformatBox} */
    public unformatBox(style: BoxStyle): this {
        return this.#updateAllContent(content => content.unformatBox(FlowRange.at(0, content.size), style));
    }

    /** {@inheritdoc FlowNode.unformatText} */
    public unformatText(style: TextStyle): this {
        return this.#updateAllContent(content => content.unformatText(FlowRange.at(0, content.size), style));
    }

    /** {@inheritdoc FlowNode.unformatParagraph} */
    public unformatParagraph(style: ParagraphStyle): this {
        return this.#updateAllContent(content => content.unformatParagraph(FlowRange.at(0, content.size), style));
    }

    #updateAllContent(callback: (content: FlowContent, row: number, column: number) => FlowContent): this {
        let tableChanged = false;
        const updatedRowArray = new Array<FlowTableRow>(this.rows.length);

        for (let r = 0; r < updatedRowArray.length; ++r) {
            const oldRow = this.rows[r];
            const updatedCellArray = new Array<FlowTableCell>(oldRow.cells.length);
            let rowChanged = false;
            
            for (let c = 0; c < updatedCellArray.length; ++c) {
                const oldCell = oldRow.cells[c];
                const oldContent = oldCell.content;
                const newContent = callback(oldContent, r, c);
                const cellChanged = !oldContent.equals(newContent);
                updatedCellArray[c] = cellChanged ? oldCell.set("content", newContent) : oldCell;
                rowChanged = rowChanged || cellChanged;
            }

            updatedRowArray[r] = rowChanged ? oldRow.set("cells", Object.freeze(updatedCellArray)) : oldRow;
            tableChanged = tableChanged || rowChanged;
        }

        if (!tableChanged) {
            return this;
        }

        // TODO: PERF: Since we're not updating the table structure we could safely skip validating it in the ctor
        return this.set("rows", Object.freeze(updatedRowArray));
    }

    #visitAllContent(callback: (content: FlowContent, row: number, column: number) => void): void {
        const { rows } = this;
        for (let r = 0; r < rows.length; ++r) {
            const { cells } = rows[r];
            for (let c = 0; c < cells.length; ++c) {
                callback(cells[c].content, r, c);
            }
        }
    }

    #getTableIndex(row: number, column: number): number {
        return row * this.columns.length + column;
    }
}

interface CellMapping {
    rowIndex: number;
    columnIndex: number;
    rowCellIndex: number;
}

const processTableRow = (
    rowIndex: number,
    cellsOnRow: readonly FlowTableCell[],
    straddlingColumns: number[],
    mappingByTableIndex: CellMapping[],
): void => {
    let cellIndexOnRow = 0;
                
    for (let colIndex = 0; colIndex < straddlingColumns.length; ++colIndex) {
        const straddleCount = straddlingColumns[colIndex];
        if (straddleCount > 0) {
            straddlingColumns[colIndex] = straddleCount - 1;
        } else if (cellIndexOnRow >= cellsOnRow.length) {
            throw new RangeError(`Flow table row #${rowIndex} has too few cells`);
        } else {
            const cell = cellsOnRow[cellIndexOnRow];
            processTableCell(
                rowIndex,
                colIndex,
                cellIndexOnRow,
                cell,
                straddlingColumns,
                mappingByTableIndex
            );
            ++cellIndexOnRow;
            colIndex += cell.colSpan - 1;
        }
    }

    if (cellsOnRow.length >= cellIndexOnRow) {
        throw new RangeError(`Flow table row #${rowIndex} has too many cells`);
    }
};

const processTableCell = (
    rowIndex: number,
    columnIndex: number,
    rowCellIndex: number,
    cell: FlowTableCell,
    straddlingColumns: number[],
    mappingByTableIndex: CellMapping[],
): void => {
    const straddleCount = cell.rowSpan - 1;
    for (let c = 0; c < cell.colSpan; ++c) {
        if (straddleCount !== (straddlingColumns[columnIndex + c] += straddleCount)) {
            const msg = `Column #${columnIndex} in flow table row #${rowIndex} is overflowing a straddled cell`;
            throw new RangeError(msg);
        }

        for (let r = 0; r < cell.rowSpan; ++r) {
            const tableIndex = (rowIndex + r) * straddlingColumns.length + c;
            mappingByTableIndex[tableIndex] = {
                rowIndex,
                columnIndex,
                rowCellIndex,
            };
        }
    }
};
