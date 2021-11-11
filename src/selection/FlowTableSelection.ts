import { 
    frozen, 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating 
} from "paratype";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection, RemoveFlowSelectionOptions, TargetOptions } from "./FlowSelection";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowSelectionRegistry } from "../internal/class-registry";
import { CellRange } from "./CellRange";
import { FlowRange } from "./FlowRange";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "../internal/transform-helpers";
import { TextStyle, TextStyleProps } from "../styles/TextStyle";
import { BoxStyle, BoxStyleProps } from "../styles/BoxStyle";
import { FlowTable } from "../nodes/FlowTable";
import { ParagraphStyle, ParagraphStyleProps } from "../styles/ParagraphStyle";
import { EditTableCell } from "../operations/EditTableCell";
import { FlowBatch } from "../operations/FlowBatch";
import { ImageSource } from "../structure/ImageSource";
import { ResetContent } from "../operations/ResetContent";

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
@frozen
@validating
@FlowSelectionRegistry.register
export class FlowTableSelection extends FlowTableSelectionBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowTableSelection);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowTableSelectionData): FlowTableSelection {
        const { table: position, range } = data;
        return new FlowTableSelection({ position, range });
    }

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
            const innerResult = content.selectAll().getUniformBoxStyle(cellContent, cellTheme, diff);
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
            const innerResult = content.selectAll().getUniformParagraphStyle(cellContent, cellTheme, diff);
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
            const innerResult = content.selectAll().getUniformTextStyle(cellContent, cellTheme, diff);
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
            cellContent.selectAll().formatBox(style, { target: cellContent, theme: cellTheme })
        ));
    }

    /**
     * {@inheritDoc FlowSelection.formatList}
     * @override
     */
    public formatList(content: FlowContent, kind: "ordered" | "unordered" | null): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            cellContent.selectAll().formatList(cellContent, kind)
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
            cellContent.selectAll().formatParagraph(style, { target: cellContent, theme: cellTheme })
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
            cellContent.selectAll().formatText(style, { target: cellContent, theme: cellTheme })
        ));
    }

    /**
     * {@inheritDoc FlowSelection.incrementListLevel}
     * @override
     */
    public incrementListLevel(content: FlowContent, delta?: number): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            cellContent.selectAll().incrementListLevel(cellContent, delta)
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
    public setDynamicTextExpression(content: FlowContent, expression: string): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            cellContent.selectAll().setDynamicTextExpression(cellContent, expression)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.setIcon}
     * @override
     */
    public setIcon(content: FlowContent, data: string): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            cellContent.selectAll().setIcon(cellContent, data)
        ));
    }

    /**
     * {@inheritDoc FlowSelection.setIcon}
     * @override
     */
    public setImageSource(content: FlowContent, source: ImageSource): FlowOperation | null {
        return this.#updateAllCellContent(content, undefined, cellContent => (
            cellContent.selectAll().setImageSource(cellContent, source)
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
     * {@inheritDoc FlowSelection.unformatBox}
     * @override
     */
    public unformatBox(): FlowOperation | null {
        // TODO: To support this we need the outer content (otherwise we don't know about the cells...)
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatParagraph(): FlowOperation | null {
        // TODO: To support this we need the outer content (otherwise we don't know about the cells...)
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatText(): FlowOperation | null {
        // TODO: To support this we need the outer content (otherwise we don't know about the cells...)
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertion}
     * @override
     */
    afterInsertion(range: FlowRange): FlowSelection | null {
        const before = FlowRange.at(this.position, 1);
        const after = transformRangeAfterInsertion(before, range);
        return this.#wrapPosition(after);
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertion}
     * @override
     */
    afterRemoval(range: FlowRange, mine: boolean): FlowSelection | null {
        const before = FlowRange.at(this.position, 1);
        const after = transformRangeAfterRemoval(before, range, mine);
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
        table.content.positions.forEach(position => {
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
        table.content.positions.forEach(position => {
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