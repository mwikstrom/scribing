import { 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
} from "paratype";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection, RemoveFlowSelectionOptions, TargetOptions, VisitRangeOptions } from "./FlowSelection";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowSelectionRegistry } from "../internal/class-registry";
import { CellRange } from "./CellRange";
import { FlowRange } from "./FlowRange";
import { getRangeAfterInsertion, getRangeAfterRemoval } from "../internal/transform-helpers";
import { TextStyle, TextStyleProps } from "../styles/TextStyle";
import { BoxStyle, BoxStyleProps } from "../styles/BoxStyle";
import { FlowTable } from "../nodes/FlowTable";
import { ParagraphStyle, ParagraphStyleProps } from "../styles/ParagraphStyle";
import { EditTableCell } from "../operations/EditTableCell";
import { FlowBatch } from "../operations/FlowBatch";
import { ImageSource } from "../structure/ImageSource";
import { ResetContent } from "../operations/ResetContent";
import { TableStyle } from "../styles/TableStyle";
import { TableColumnStyle } from "../styles/TableColumnStyle";
import { FormatTable } from "../operations/FormatTable";
import { UnformatTable } from "../operations/UnformatTable";
import { FormatTableColumn } from "../operations/FormatTableColumn";
import { UnformatTableColumn } from "../operations/UnformatTableColumn";
import { InsertTableColumn } from "../operations/InsertTableColumn";
import { InsertTableRow } from "../operations/InsertTableRow";
import { RemoveTableColumn } from "../operations/RemoveTableColumn";
import { RemoveTableRow } from "../operations/RemoveTableRow";
import { MergeTableCell } from "../operations/MergeTableCell";
import { CellPosition } from "./CellPosition";
import { SplitTableCell } from "../operations/SplitTableCell";
import { FlowRangeSelection } from "./FlowRangeSelection";
import { FlowTableCellSelection } from "./FlowTableCellSelection";
import { RemoveRange } from "../operations/RemoveRange";
import { InsertContent } from "../operations/InsertContent";
import { Script } from "../structure/Script";
import { VideoSource } from "../structure/VideoSource";

const Props = {
    position: nonNegativeIntegerType,
    range: CellRange.classType,
};

const Data = {
    table: Props.position,
    range: CellRange.classType,
};

const PropsType: RecordType<FlowTableSelectionProps> = recordType(Props);
const DataType: RecordType<FlowTableSelectionData> = recordType(Data);

const propsToData = (
    { position: table, range, }: FlowTableSelectionProps
): FlowTableSelectionData => ({ table, range });

/**
 * The base record class for {@link FlowTableSelection}
 * @public
 */
export const FlowTableSelectionBase = RecordClass(PropsType, FlowSelection, DataType, propsToData);

/**
 * Properties of {@link FlowTableSelection}
 * @public
 */
export interface FlowTableSelectionProps {
    position: number;
    range: CellRange;
}

/**
 * Data of {@link FlowTableSelection}
 * @public
 */
export interface FlowTableSelectionData {
    table: number;
    range: CellRange;
}

/**
 * Represents a selection of cells in a flow table cell
 * @public
 * @sealed
 */
@FlowSelectionRegistry.register
export class FlowTableSelection extends FlowTableSelectionBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowTableSelection);

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: FlowTableSelectionData): FlowTableSelection {
        const { table: position, range } = data;
        return new FlowTableSelection({ position, range });
    }

    /** 
     * This property exists to allow late bound type checking (instead of using instanceof)
     * It was added to avoid circular module dependency via TableOperation
     * @internal 
     */
    readonly __is_table_selection__ = true;

    /**
     * {@inheritDoc FlowSelection.isCollapsed}
     * @override
     */
    public get isCollapsed(): boolean {
        return false;
    }

    /**
     * {@inheritDoc FlowSelection.getUniformBoxStyle}
     * @override
     */
    public getUniformBoxStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff: Set<keyof BoxStyleProps> = new Set(),
    ): BoxStyle {
        let result = BoxStyle.empty;
        this.#forEachCellContent(content, theme, (cellContent, cellTheme) => {
            const innerResult = selectAll(cellContent).getUniformBoxStyle(cellContent, cellTheme, diff);
            result = result.merge(innerResult, diff);
        });
        return result;
    }

    /**
     * {@inheritDoc FlowSelection.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff: Set<keyof ParagraphStyleProps> = new Set(),
    ): ParagraphStyle {
        let result = ParagraphStyle.empty;
        this.#forEachCellContent(content, theme, (cellContent, cellTheme) => {
            const innerResult = selectAll(cellContent).getUniformParagraphStyle(cellContent, cellTheme, diff);
            result = result.merge(innerResult, diff);
        });
        return result;
    }

    /**
     * {@inheritDoc FlowSelection.getUniformTextStyle}
     * @override
     */
    public getUniformTextStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof TextStyleProps>,
    ): TextStyle {
        let result = TextStyle.empty;
        this.#forEachCellContent(content, theme, (cellContent, cellTheme) => {
            const innerResult = selectAll(cellContent).getUniformTextStyle(cellContent, cellTheme, diff);
            result = result.merge(innerResult, diff);
        });
        return result;
    }

    /**
     * {@inheritDoc FlowSelection.formatBox}
     * @override
     */
    public formatBox(
        style: BoxStyle,
        options: TargetOptions = {},
    ): FlowOperation | null {
        const { target, theme } = options;
        return this.#updateAllCellContent(target, theme, (cellContent, cellTheme) => (
            selectAll(cellContent).formatBox(style, { target: cellContent, theme: cellTheme })
        ));
    }

    /**
     * {@inheritDoc FlowSelection.formatList}
     * @override
     */
    public formatList(content: FlowContent, kind: "ordered" | "unordered" | null): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            selectAll(cellContent).formatList(cellContent, kind)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.formatParagraph}
     * @override
     */
    public formatParagraph(
        style: ParagraphStyle,
        options: TargetOptions = {},
    ): FlowOperation | null {
        const { target, theme } = options;
        return this.#updateAllCellContent(target, theme, (cellContent, cellTheme) => (
            selectAll(cellContent).formatParagraph(style, { target: cellContent, theme: cellTheme })
        ));
    }

    /**
     * {@inheritDoc FlowSelection.formatText}
     * @override
     */
    public formatText(
        style: TextStyle,
        options: TargetOptions = {},
    ): FlowOperation | null {
        const { target, theme } = options;
        return this.#updateAllCellContent(target, theme, (cellContent, cellTheme) => (
            selectAll(cellContent).formatText(style, { target: cellContent, theme: cellTheme })
        ));
    }

    /**
     * {@inheritDoc FlowSelection.incrementListLevel}
     * @override
     */
    public incrementListLevel(content: FlowContent, delta?: number): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            selectAll(cellContent).incrementListLevel(cellContent, delta)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.insert}
     * @override
     */
    public insert(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.remove}
     * @override
     */
    public remove(options: RemoveFlowSelectionOptions = {}): FlowOperation | null {
        const { target, theme } = options;
        if (!target) {
            return null;
        }
        const table = this.#getTableNode(target);
        const op = new ResetContent({ content: table.content.defaultCellContent });
        return this.#updateAllCellContent(target, theme, () => op);
    }

    /**
     * {@inheritDoc FlowSelection.setDynamicTextExpression}
     * @override
     */
    public setDynamicTextExpression(content: FlowContent, expression: Script): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            selectAll(cellContent).setDynamicTextExpression(cellContent, expression)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.setIcon}
     * @override
     */
    public setIcon(content: FlowContent, data: string): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            selectAll(cellContent).setIcon(cellContent, data)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.setImageSource}
     * @override
     */
    public setImageSource(content: FlowContent, source: ImageSource): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            selectAll(cellContent).setImageSource(cellContent, source)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.setVideoSource}
     * @override
     */
    public setVideoSource(content: FlowContent, source: VideoSource): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            selectAll(cellContent).setVideoSource(cellContent, source)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.setImageScale}
     * @override
     */
    public setImageScale(content: FlowContent, scale: number): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            selectAll(cellContent).setImageScale(cellContent, scale)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.transformRanges}
     * @override
     */
    public transformRanges(
        transform: (range: FlowRange, options?: TargetOptions) => FlowRange | null,
        options: TargetOptions = {},
    ): FlowSelection | null {
        const { target, theme } = options;
        if (!target) {
            return null;
        }
        let changed = false;
        this.#forEachCellContent(target, theme, (cellContent, cellTheme) => {
            const before = FlowRange.at(0, cellContent.size);
            const after = transform(before, { target: cellContent, theme: cellTheme });
            changed = changed || !after || !before.equals(after);
        });
        return changed ? null : this;
    }

    /**
     * {@inheritDoc FlowSelection.transformRanges}
     * @override
     */
    public visitRanges(
        callback: (range: FlowRange | CellRange, options: VisitRangeOptions) => void,
        options: Partial<VisitRangeOptions> = {},
    ): void {
        const { wrap: outerWrap = FlowSelection.rootWrap, ...rest } = options;
        const wrap: VisitRangeOptions["wrap"] = inner => {
            if (inner instanceof CellRange) {
                return outerWrap(this.set("range", inner));
            } else if (inner instanceof FlowRange) {
                return outerWrap(new FlowTableCellSelection({
                    position: this.position,
                    cell: this.range.focus,
                    content: new FlowRangeSelection({ range: inner }),
                }));
            } else {
                return outerWrap(inner);
            }
        };
        const replace: VisitRangeOptions["replace"] = inner => outerWrap(inner);
        callback(this.range, { 
            ...rest,
            wrap,
            replace,
            position: this.position,
            parent: options,
        });
    }

    /**
     * {@inheritDoc FlowSelection.unformatBox}
     * @override
     */
    public unformatBox(style: BoxStyle, options: TargetOptions = {}): FlowOperation | null {
        const { target, theme } = options;
        return this.#updateAllCellContent(target, theme, (cellContent, cellTheme) => (
            selectAll(cellContent).unformatBox(style, { target: cellContent, theme: cellTheme })
        ));
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatParagraph(style: ParagraphStyle, options: TargetOptions = {}): FlowOperation | null {
        const { target, theme } = options;
        return this.#updateAllCellContent(target, theme, (cellContent, cellTheme) => (
            selectAll(cellContent).unformatParagraph(style, { target: cellContent, theme: cellTheme })
        ));
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatText(style: TextStyle, options: TargetOptions = {}): FlowOperation | null {
        const { target, theme } = options;
        return this.#updateAllCellContent(target, theme, (cellContent, cellTheme) => (
            selectAll(cellContent).unformatText(style, { target: cellContent, theme: cellTheme })
        ));
    }

    /**
     * {@inheritDoc FlowSelection.formatTable}
     * @override
     */
    public formatTable(style: TableStyle): FlowOperation | null {
        return new FormatTable({ position: this.position, style });
    }

    /**
     * {@inheritDoc FlowSelection.unformatTable}
     * @override
     */
    public unformatTable(style: TableStyle): FlowOperation | null {
        return new UnformatTable({ position: this.position, style });
    }

    /**
     * {@inheritDoc FlowSelection.formatTableColumn}
     * @override
     */
    public formatTableColumn(style: TableColumnStyle): FlowOperation | null {
        const { first, last } = this.range.columnRange;
        const ops: FlowOperation[] = [];
        for (let i = first; i <= last; ++i) {
            ops.push(new FormatTableColumn({ 
                position: this.position, 
                column: i, 
                style,
            }));
        }
        return FlowBatch.fromArray(ops);
    }

    /**
     * {@inheritDoc FlowSelection.unformatTableColumn}
     * @override
     */
    public unformatTableColumn(style: TableColumnStyle): FlowOperation | null {
        const { first, last } = this.range.columnRange;
        const ops: FlowOperation[] = [];
        for (let i = first; i <= last; ++i) {
            ops.push(new UnformatTableColumn({ 
                position: this.position, 
                column: i, 
                style, 
            }));
        }
        return FlowBatch.fromArray(ops);
    }

    /**
     * {@inheritDoc FlowSelection.insertTableColumnBefore}
     * @override
     */
    public insertTableColumnBefore(_: FlowContent, count?: number): FlowOperation | null {
        const range = this.range.columnRange;
        return new InsertTableColumn({ 
            position: this.position, 
            column: range.first, 
            count: count ?? (range.size + 1), 
        });
    }

    /**
     * {@inheritDoc FlowSelection.insertTableColumnAfter}
     * @override
     */
    public insertTableColumnAfter(content: FlowContent, count?: number): FlowOperation | null {
        const range = this.range.columnRange;
        return new InsertTableColumn({ 
            position: this.position, 
            column: range.last + 1, 
            count: count ?? (range.size + 1), 
        });
    }

    /**
     * {@inheritDoc FlowSelection.insertTableRowBefore}
     * @override
     */
    public insertTableRowBefore(content: FlowContent, count?: number): FlowOperation | null {
        const range = this.range.rowRange;
        return new InsertTableRow({ 
            position: this.position, 
            row: range.first, 
            count: count ?? (range.size + 1), 
        });
    }

    /**
     * {@inheritDoc FlowSelection.insertTableRowAfter}
     * @override
     */
    public insertTableRowAfter(content: FlowContent, count?: number): FlowOperation | null {
        const range = this.range.rowRange;
        return new InsertTableRow({ 
            position: this.position, 
            row: range.last + 1, 
            count: count ?? (range.size + 1),
        });
    }

    /**
     * {@inheritDoc FlowSelection.removeTableColumn}
     * @override
     */
    public removeTableColumn(): FlowOperation | null {
        const range = this.range.columnRange;
        return new RemoveTableColumn({
            position: this.position,
            column: range.first,
            count: range.size + 1,
        });
    }

    /**
     * {@inheritDoc FlowSelection.removeTableRow}
     * @override
     */
    public removeTableRow(): FlowOperation | null {
        const range = this.range.rowRange;
        return new RemoveTableRow({
            position: this.position,
            row: range.first,
            count: range.size + 1,
        });
    }

    /**
     * {@inheritDoc FlowSelection.mergeTableCell}
     * @override
     */
    public mergeTableCell(content: FlowContent): FlowOperation | null {
        const { firstRowIndex, lastRowIndex, firstColumnIndex, lastColumnIndex } = this.range;
        const table = this.#getTableNode(content);
        const colSpan = 1 + lastColumnIndex - firstColumnIndex;
        const rowSpan = 1 + lastRowIndex - firstRowIndex;
        const mergedPos = CellPosition.at(firstRowIndex, firstColumnIndex);
        const operations: FlowOperation[] = [];
        let appendPos = table.content.getCell(mergedPos, true).content.size;

        for (let r = firstRowIndex; r <= lastRowIndex; ++r) {
            for (let c = r === firstRowIndex ? firstColumnIndex + 1 : firstColumnIndex; c <= lastColumnIndex; ++c) {
                const spannedPos = CellPosition.at(r, c);
                const spannedContent = table.content.getCell(spannedPos, true).content;
                if (!spannedContent.equals(table.content.defaultCellContent)) {
                    operations.push(new EditTableCell({
                        position: this.position,
                        cell: spannedPos,
                        inner: new RemoveRange({
                            range: FlowRange.at(0, spannedContent.size)
                        }),
                    }));
                    operations.push(new EditTableCell({
                        position: this.position,
                        cell: mergedPos,
                        inner: new InsertContent({
                            position: appendPos,
                            content: spannedContent,
                        }),
                    }));
                    appendPos += spannedContent.size;
                }
            }
        }

        operations.push(new MergeTableCell({
            position: this.position,
            cell: mergedPos,
            colSpan,
            rowSpan,
        }));

        return FlowBatch.fromArray(operations);
    }

    /**
     * {@inheritDoc FlowSelection.splitTableCell}
     * @override
     */
    public splitTableCell(): FlowOperation | null {
        const { firstRowIndex, firstColumnIndex, isSingleCell } = this.range;
        if (isSingleCell) {            
            return new SplitTableCell({
                position: this.position,
                cell: CellPosition.at(firstRowIndex, firstColumnIndex),
            });    
        } else {
            return null;
        }
    }

    /**
     * {@inheritDoc FlowSelection.setMarkupTag}
     * @override
     */
    setMarkupTag(content: FlowContent, tag: string): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            selectAll(cellContent).setMarkupTag(cellContent, tag)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.setMarkupAttr}
     * @override
     */
    setMarkupAttr(content: FlowContent, key: string, value: string | Script): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            selectAll(cellContent).setMarkupAttr(cellContent, key, value)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.unsetMarkupAttr}
     * @override
     */
    unsetMarkupAttr(content: FlowContent, key: string): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            selectAll(cellContent).unsetMarkupAttr(cellContent, key)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertFlow}
     * @override
     */
    afterInsertFlow(range: FlowRange): FlowSelection | null {
        const before = FlowRange.at(this.position, 1);
        const after = getRangeAfterInsertion(before, range);
        return this.#wrapPosition(after);
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertFlow}
     * @override
     */
    afterRemoveFlow(range: FlowRange, mine: boolean): FlowSelection | null {
        const before = FlowRange.at(this.position, 1);
        const after = getRangeAfterRemoval(before, range, mine);
        return this.#wrapPosition(after);
    }

    #forEachCellContent(
        content: FlowContent,
        theme: FlowTheme | undefined,
        callback: (
            content: FlowContent,
            theme: FlowTheme,
        ) => void
    ): void {
        const table = this.#getTableNode(content);
        table.content.positions.filter(position => this.range.contains(position)).forEach(position => {
            const cellTheme = table.getCellTheme(position, theme);
            const cellContent = table.content.getCell(position, true).content;
            callback(cellContent, cellTheme);
        });        
    }

    #updateAllCellContent(
        content: FlowContent | undefined,
        theme: FlowTheme | undefined,
        callback: (
            content: FlowContent,
            theme: FlowTheme,
        ) => FlowOperation | null
    ): FlowOperation | null {
        if (!content) {
            return null;
        }
        const table = this.#getTableNode(content);
        const outer: EditTableCell[] = [];
        table.content.positions.filter(position => this.range.contains(position)).forEach(position => {
            const cellTheme = table.getCellTheme(position, theme);
            const cellContent = table.content.getCell(position, true).content;
            const inner = callback(cellContent, cellTheme);
            if (inner) {
                outer.push(new EditTableCell({
                    position: this.position,
                    cell: position,
                    inner,
                }));
            }
        });
        return FlowBatch.fromArray(outer);
    }

    #getTableNode(content: FlowContent): FlowTable {
        const { position } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowTable) {
            return node;
        } else {
            throw new Error(`Expected a flow table at position ${position}`);
        }
    }

    #wrapPosition(range: FlowRange | null): FlowSelection | null {
        if (range && range.size === 1) {
            return this.set("position", range.first);
        } else {
            return null;
        }
    }
}

const selectAll = (content: FlowContent): FlowSelection => new FlowRangeSelection({
    range: FlowRange.at(0, content.size )
});
