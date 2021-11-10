import { 
    frozen, 
    mapType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating
} from "paratype";
import { BoxStyle } from "../styles/BoxStyle";
import { CellPosition } from "../selection/CellPosition";
import { DefaultFlowTheme } from "../styles/DefaultFlowTheme";
import { FlowContent } from "../structure/FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowRange } from "../selection/FlowRange";
import { FlowRangeSelection } from "../selection/FlowRangeSelection";
import { FlowTableContent } from "../structure/FlowTableContent";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowNodeRegistry } from "../internal/class-registry";
import { ParagraphStyle, ParagraphStyleProps } from "../styles/ParagraphStyle";
import { ParagraphTheme } from "../styles/ParagraphTheme";
import { TableColumnStyle } from "../styles/TableColumnStyle";
import { TableStyle } from "../styles/TableStyle";
import { TextStyle, TextStyleProps } from "../styles/TextStyle";

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

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowTableData): FlowTable {
        const { table: content, columns = new Map(), style = TableStyle.empty } = data;
        return new FlowTable({ content, columns: Object.freeze(columns), style });
    }

    public getRowGroup(position: CellPosition): TableRowGroup {
        // TODO: IMPLEMENT
        return "body";
    }

    public getColumnGroup(position: CellPosition): TableColumnGroup {
        // TODO: IMPLEMENT
        return "body";
    }

    public getCellVariant(position: CellPosition): TableCellVariant {
        const rowGroup = this.getRowGroup(position);
        const colGroup = this.getColumnGroup(position);

        if (colGroup === "body") {
            return rowGroup;
        } else {
            return `${rowGroup}-${colGroup}-column`;
        }
    }

    public getCellTheme(position: CellPosition, outer?: FlowTheme): FlowTheme {
        const variant = this.getCellVariant(position);
        return (outer ?? DefaultFlowTheme.instance).getCellTheme(variant);
    }

    /** {@inheritdoc FlowNode.completeUpload} */
    completeUpload(id: string, url: string): FlowNode {
        return this.#updateAllContent(content => content.completeUpload(id, url));
    }

    /** {@inheritdoc FlowNode.formatBox} */
    public formatBox(style: BoxStyle, theme?: FlowTheme): this {
        return this.#updateAllContent((content, position) => 
            content.formatBox(FlowRange.at(0, content.size), style, this.getCellTheme(position, theme))
        );
    }

    /** {@inheritdoc FlowNode.formatText} */
    public formatText(style: TextStyle, theme?: FlowTheme): this {
        return this.#updateAllContent((content, position) => 
            content.formatText(FlowRange.at(0, content.size), style, this.getCellTheme(position, theme))
        );
    }

    /** {@inheritdoc FlowNode.formatParagraph} */
    public formatParagraph(style: ParagraphStyle, theme?: FlowTheme): this {
        return this.#updateAllContent((content, position) => 
            content.formatParagraph(FlowRange.at(0, content.size), style, this.getCellTheme(position, theme))
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
        this.#visitAllContent((content, position) => {
            const range = FlowRange.at(0, content.size);
            const selection = new FlowRangeSelection({ range });
            const innerTheme =  this.getCellTheme(position, theme?.getFlowTheme());
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
        this.#visitAllContent((content,position) => {
            const range = FlowRange.at(0, content.size);
            const selection = new FlowRangeSelection({ range });
            const innerTheme =  this.getCellTheme(position, theme?.getFlowTheme());
            const uniform = selection.getUniformTextStyle(content, innerTheme, diff);
            result = result.merge(uniform, diff);
        });
        return result;
    }

    /** {@inheritdoc FlowNode.unformatAmbient} */
    public unformatAmbient(theme: ParagraphTheme): this {
        return this.#updateAllContent((content, position) => 
            content.unformatAmbient(this.getCellTheme(position, theme?.getFlowTheme()))
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

    #updateAllContent(callback: (content: FlowContent, position: CellPosition) => FlowContent): this {
        return this.set("content", this.content.updateAllContent(callback));
    }

    #visitAllContent(callback: (content: FlowContent, position: CellPosition) => void): void {
        for (const position of this.content.positions) {
            callback(this.content.getCell(position, true).content, position);
        }
    }
}
