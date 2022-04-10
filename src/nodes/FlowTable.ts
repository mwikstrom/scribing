import { 
    mapType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
} from "paratype";
import { CellPosition } from "../selection/CellPosition";
import { DefaultFlowTheme } from "../styles/DefaultFlowTheme";
import { FlowContent } from "../structure/FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowTableContent } from "../structure/FlowTableContent";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowNodeRegistry } from "../internal/class-registry";
import { ParagraphStyle } from "../styles/ParagraphStyle";
import { TableColumnStyle } from "../styles/TableColumnStyle";
import { TableStyle } from "../styles/TableStyle";
import { TextStyle } from "../styles/TextStyle";
import type { FlowNodeVisitor } from "../structure/FlowNodeVisitor";

const Props = {
    content: FlowTableContent.classType,
    columns: mapType(TableColumnStyle.classType),
    style: TableStyle.classType,
};

const Data = {
    table: FlowTableContent.classType,
    columns: mapType(TableColumnStyle.classType),
    style: TableStyle.classType,
};

const PropsType: RecordType<FlowTableProps> = recordType(Props);
const DataType: RecordType<FlowTableData> = recordType(Data).withOptional("columns", "style");

const propsToData = ({ content: table, columns, style }: FlowTableProps): FlowTableData  => {
    const data: FlowTableData = { table };

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
    content: FlowTableContent;
    columns: Map<string, TableColumnStyle>;
    // TODO: Add row styles
    style: TableStyle;
}

/**
 * Data of {@link FlowTable}
 * @public
 */
export interface FlowTableData {
    table: FlowTableContent;
    columns?: Map<string, TableColumnStyle>;
    style?: TableStyle;
}

/**
 * Represents a flow table cell
 * @public
 * @sealed
 */
@FlowNodeRegistry.register
export class FlowTable extends FlowTableBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowTable);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: FlowTableData): FlowTable {
        const { table: content, columns = new Map(), style = TableStyle.empty } = data;
        return new FlowTable({ content, columns: Object.freeze(columns), style });
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept(visitor: FlowNodeVisitor): FlowNode {
        return visitor.visitTable(this);
    }

    /** {@inheritdoc FlowNode.completeUpload} */
    completeUpload(id: string, url: string): FlowNode {
        return this.#updateAllContent(content => content.completeUpload(id, url));
    }

    /** {@inheritdoc FlowNode.formatBox} */
    public formatBox(/*style: BoxStyle, theme?: FlowTheme*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        /*return this.#updateAllContent((content, position) => 
            content.formatBox(FlowRange.at(0, content.size), style, this.getCellTheme(position, theme))
        );*/
    }

    /** {@inheritdoc FlowNode.formatText} */
    public formatText(/*style: TextStyle, theme?: FlowTheme*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        /*return this.#updateAllContent((content, position) => 
            content.formatText(FlowRange.at(0, content.size), style, this.getCellTheme(position, theme))
        );*/
    }

    /** {@inheritdoc FlowNode.formatParagraph} */
    public formatParagraph(/*style: ParagraphStyle, theme?: FlowTheme*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        /*return this.#updateAllContent((content, position) => 
            content.formatParagraph(FlowRange.at(0, content.size), style, this.getCellTheme(position, theme))
        );*/
    }

    /**
     * {@inheritDoc FlowNode.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(/*theme?: ParagraphTheme, diff: Set<keyof ParagraphStyleProps> = new Set(),*/
    ): ParagraphStyle | null {
        return null;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        /*let result = ParagraphStyle.empty;
        this.#visitAllContent((content, position) => {
            const range = FlowRange.at(0, content.size);
            const selection = new FlowRangeSelection({ range });
            const innerTheme =  this.getCellTheme(position, theme?.getFlowTheme());
            const uniform = selection.getUniformParagraphStyle(content, innerTheme, diff);
            result = result.merge(uniform, diff);
        });
        return result;*/
    }

    /** @internal */
    getCellTheme(position: CellPosition, outer?: FlowTheme): FlowTheme {
        // TODO: Table/cell theme
        return outer ?? DefaultFlowTheme.instance;
    }

    /**
     * {@inheritDoc FlowNode.getUniformTextStyle}
     * @override
     */
    public getUniformTextStyle(/*theme?: ParagraphTheme, diff: Set<keyof TextStyleProps> = new Set(),*/
    ): TextStyle | null {
        return null;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        /*let result = TextStyle.empty;
        this.#visitAllContent((content,position) => {
            const range = FlowRange.at(0, content.size);
            const selection = new FlowRangeSelection({ range });
            const innerTheme =  this.getCellTheme(position, theme?.getFlowTheme());
            const uniform = selection.getUniformTextStyle(content, innerTheme, diff);
            result = result.merge(uniform, diff);
        });
        return result;*/
    }

    /** {@inheritdoc FlowNode.unformatAmbient} */
    public unformatAmbient(/*theme: ParagraphTheme*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        /*return this.#updateAllContent((content, position) => 
            content.unformatAmbient(this.getCellTheme(position, theme?.getFlowTheme()))
        );*/
    }

    /** {@inheritdoc FlowNode.unformatBox} */
    public unformatBox(/*style: BoxStyle*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        // return this.#updateAllContent(content => content.unformatBox(FlowRange.at(0, content.size), style));
    }

    /** {@inheritdoc FlowNode.unformatText} */
    public unformatText(/*style: TextStyle*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        // return this.#updateAllContent(content => content.unformatText(FlowRange.at(0, content.size), style));
    }

    /** {@inheritdoc FlowNode.unformatParagraph} */
    public unformatParagraph(/*style: ParagraphStyle*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        // return this.#updateAllContent(content => content.unformatParagraph(FlowRange.at(0, content.size), style));
    }

    formatColumn(index: number, style: TableColumnStyle): FlowTable {
        const key = CellPosition.stringifyColumnIndex(index, true);
        const before = this.columns.get(key) ?? TableColumnStyle.empty;
        const after = before.merge(style);
        const newColumns = new Map(this.columns);
        newColumns.set(key, after);
        return this.set("columns", newColumns);
    }

    unformatColumn(index: number, style: TableColumnStyle): FlowTable {
        const key = CellPosition.stringifyColumnIndex(index, true);
        const before = this.columns.get(key);
        if (!before) {
            return this;
        }
        const after = before.unmerge(style);
        const newColumns = new Map(this.columns);
        newColumns.set(key, after);
        return this.set("columns", newColumns);
    }

    insertColumn(index: number, count = 1): FlowTable {
        const newContent = this.content.insertColumn(index, count);
        const newColumns = new Map();
        for (const [key, style] of this.columns) {
            const existing = CellPosition.parseColumnIndex(key);
            if (existing === null || existing < index) {
                newColumns.set(key, style);
            } else {
                newColumns.set(CellPosition.stringifyColumnIndex(existing + count), style);
            }
        }
        return this.merge({ content: newContent, columns: newColumns });
    }

    removeColumn(index: number, count = 1): FlowTable {
        const newContent = this.content.removeColumn(index, count);
        const newColumns = new Map();
        for (const [key, style] of this.columns) {
            const existing = CellPosition.parseColumnIndex(key);
            if (existing === null || existing < index) {
                newColumns.set(key, style);
            } else if (existing >= index + count) {
                newColumns.set(CellPosition.stringifyColumnIndex(existing - count), style);
            }
        }
        return this.merge({ content: newContent, columns: newColumns });
    }

    insertRow(index: number, count = 1): FlowTable {
        const newContent = this.content.insertRow(index, count);
        return this.set("content", newContent);
    }

    removeRow(index: number, count = 1): FlowTable {
        const newContent = this.content.removeRow(index, count);
        return this.set("content", newContent);
    }

    #updateAllContent(callback: (content: FlowContent, position: CellPosition) => FlowContent): this {
        return this.set("content", this.content.updateAllContent(callback));
    }

    // 2021-11-16: Do not cascade styling to nested content
    // TODO: Either re-enable that behavior or cleanup these comments
    /*#visitAllContent(callback: (content: FlowContent, position: CellPosition) => void): void {
        for (const position of this.content.positions) {
            callback(this.content.getCell(position, true).content, position);
        }
    }*/
}
