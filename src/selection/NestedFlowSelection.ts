import { BoxStyle, BoxStyleProps } from "../styles/BoxStyle";
import { FlowContent } from "../structure/FlowContent";
import { FlowNode } from "../nodes/FlowNode";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection, RemoveFlowSelectionOptions, TargetOptions } from "./FlowSelection";
import { FlowTheme } from "../styles/FlowTheme";
import { ImageSource } from "../structure/ImageSource";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "../internal/transform-helpers";
import { ParagraphStyle, ParagraphStyleProps } from "../styles/ParagraphStyle";
import { TextStyle, TextStyleProps } from "../styles/TextStyle";
import { TableStyle } from "../styles/TableStyle";
import { TableColumnStyle } from "../styles/TableColumnStyle";

/**
 * A nested selection at a specific flow position
 * @public
 */
export abstract class NestedFlowSelection extends FlowSelection {
    /** Position of the nested selection */
    public abstract position: number;

    /**
     * Returns a copy of the current object with the specified property merged in
     *
     * @param key - Key of the property to merge in
     * @param value - Property value to merge in
     *
     * @remarks
     * If the resulting object would be equal to the current instance, then the current
     * instance is returned instead.
     */
    public abstract set(key: "position", value: number): this;

    /**
     * Gets the selected (outer) node
     * @param outer - The outer content
     */
    protected getSelectedNode(outer: FlowContent): FlowNode {
        const { node, offset } = outer.peek(this.position);
        if (offset === 0 && node && node.size === 1) {
            return node;
        } else {
            throw new Error("Invalid content for nested selection");
        }
    }

    /**
     * Gets the inner content
     * @param outer - The outer content
     */
    protected getInnerContent(outer: FlowContent): FlowContent {
        const node = this.getSelectedNode(outer);
        return this.getInnerContentFromNode(node);
    }

    /**
     * Gets the inner theme
     * @param outerContent - The outer content
     * @param outerTheme - The outer theme
     */
    protected getInnerTheme(outerContent: FlowContent, outerTheme?: FlowTheme): FlowTheme {
        const node = this.getSelectedNode(outerContent);
        return this.getInnerThemeFromNode(node, outerTheme);
    }

    /**
     * Gets the inner content
     * @param node - The selected node
     */
    protected abstract getInnerContentFromNode(node: FlowNode): FlowContent;

    /**
     * Gets the inner theme
     * @param node - The selected node
     * @param outer - The outer theme
     */
     protected abstract getInnerThemeFromNode(node: FlowNode, outer?: FlowTheme): FlowTheme;

    /**
     * Gets the inner selection
     */
    protected abstract getInnerSelection(): FlowSelection;

    /**
     * Wraps the specified operation so that it applies the outer selection
     * @param inner - The inner operation
     */
    protected abstract getOuterOperation(inner: FlowOperation): FlowOperation;

    /**
     * Returns a copy of this selection with the specified inner selection merged in
     * @param value - The inner selection to be merged in
     */
    protected abstract setInnerSelection(value: FlowSelection): NestedFlowSelection;

    /**
     * {@inheritDoc FlowSelection.isCollapsed}
     * @override
     */
    public get isCollapsed(): boolean {
        const innerSelection = this.getInnerSelection();
        return innerSelection.isCollapsed;
    }

    /**
     * {@inheritDoc FlowSelection.getUniformBoxStyle}
     * @override
     */
    public getUniformBoxStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof BoxStyleProps>,
    ): BoxStyle {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerTheme = this.getInnerTheme(content, theme);
        return innerSelection.getUniformBoxStyle(innerContent, innerTheme, diff);
    }

    /**
     * {@inheritDoc FlowSelection.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof ParagraphStyleProps>,
    ): ParagraphStyle {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerTheme = this.getInnerTheme(content, theme);
        return innerSelection.getUniformParagraphStyle(innerContent, innerTheme, diff);
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
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerTheme = this.getInnerTheme(content, theme);
        return innerSelection.getUniformTextStyle(innerContent, innerTheme, diff);
    }

    /**
     * {@inheritDoc FlowSelection.formatBox}
     * @override
     */
    public formatBox(
        style: BoxStyle,
        options: TargetOptions = {},
    ): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const innerOperation = innerSelection.formatBox(style, innerOptions);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.formatList}
     * @override
     */
    public formatList(content: FlowContent, kind: "ordered" | "unordered" | null): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.formatList(innerContent, kind);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.formatParagraph}
     * @override
     */
    public formatParagraph(
        style: ParagraphStyle,
        options: TargetOptions = {},
    ): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const innerOperation = innerSelection.formatParagraph(style, innerOptions);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.formatText}
     * @override
     */
    public formatText(
        style: TextStyle,
        options: TargetOptions = {},
    ): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const innerOperation = innerSelection.formatText(style, innerOptions);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.incrementListLevel}
     * @override
     */
    public incrementListLevel(content: FlowContent, delta?: number): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.incrementListLevel(innerContent, delta);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.insert}
     * @override
     */
    public insert(content: FlowContent, options?: TargetOptions): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const innerOperation = innerSelection.insert(content, innerOptions);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.remove}
     * @override
     */
    public remove(options: RemoveFlowSelectionOptions = {}): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const innerOperation = innerSelection.remove(innerOptions);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.setDynamicTextExpression}
     * @override
     */
    public setDynamicTextExpression(content: FlowContent, expression: string): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.setDynamicTextExpression(innerContent, expression);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.setIcon}
     * @override
     */
    public setIcon(content: FlowContent, data: string): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.setIcon(innerContent, data);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.setIcon}
     * @override
     */
    public setImageSource(content: FlowContent, source: ImageSource): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.setImageSource(innerContent, source);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.transformRanges}
     * @override
     */
    public transformRanges(
        transform: (range: FlowRange, options?: TargetOptions) => FlowRange | null,
        options?: TargetOptions
    ): FlowSelection | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const transformedInner = innerSelection.transformRanges(transform, innerOptions);
        return this.#wrapSelection(transformedInner);
    }

    /**
     * {@inheritDoc FlowSelection.unformatBox}
     * @override
     */
    public unformatBox(style: BoxStyle, options?: TargetOptions): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOperation = innerSelection.unformatBox(style, options);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatParagraph(style: ParagraphStyle, options?: TargetOptions): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOperation = innerSelection.unformatParagraph(style, options);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatText(style: TextStyle, options?: TargetOptions): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOperation = innerSelection.unformatText(style, options);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.formatTable}
     * @override
     */
    public formatTable(style: TableStyle, options?: TargetOptions): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOperation = innerSelection.formatTable(style, options);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.unformatTable}
     * @override
     */
    public unformatTable(style: TableStyle, options?: TargetOptions): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOperation = innerSelection.unformatTable(style, options);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.formatTableColumn}
     * @override
     */
    public formatTableColumn(style: TableColumnStyle, options?: TargetOptions): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOperation = innerSelection.formatTableColumn(style, options);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.unformatTableColumn}
     * @override
     */
    public unformatTableColumn(style: TableColumnStyle, options?: TargetOptions): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOperation = innerSelection.unformatTableColumn(style, options);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.insertTableColumnBefore}
     * @override
     */
    public insertTableColumnBefore(content: FlowContent, count?: number): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.insertTableColumnBefore(innerContent, count);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.insertTableColumnAfter}
     * @override
     */
    public insertTableColumnAfter(content: FlowContent, count?: number): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.insertTableColumnAfter(innerContent, count);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.insertTableRowBefore}
     * @override
     */
    public insertTableRowBefore(content: FlowContent, count?: number): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.insertTableRowBefore(innerContent, count);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.insertTableRowAfter}
     * @override
     */
    public insertTableRowAfter(content: FlowContent, count?: number): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.insertTableRowAfter(innerContent, count);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.removeTableColumn}
     * @override
     */
    public removeTableColumn(content: FlowContent): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.removeTableColumn(innerContent);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.removeTableRow}
     * @override
     */
    public removeTableRow(content: FlowContent): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.removeTableRow(innerContent);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.mergeTableCell}
     * @override
     */
    public mergeTableCell(content: FlowContent): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.mergeTableCell(innerContent);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.splitTableCell}
     * @override
     */
    public splitTableCell(content: FlowContent): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.splitTableCell(innerContent);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * Updates the inner selected by invoking the specified callback
     * @internal
     */
    updateInner(callback: (inner: FlowSelection) => FlowSelection | null): FlowSelection | null {
        const result = callback(this.getInnerSelection());
        return this.#wrapSelection(result);
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

    #getInnerOptions<T extends TargetOptions>(options?: T): T | undefined {
        if (options) {
            const { target: outerContent, theme: outerTheme, ...rest } = options;
            if (outerContent) {
                const target = this.getInnerContent(outerContent);
                const theme = this.getInnerTheme(outerContent, outerTheme);
                return { target, theme, ...rest } as T;
            }            
        }
        return options;
    }

    #wrapOperation(inner: FlowOperation | null): FlowOperation | null {
        if (inner) {
            return this.getOuterOperation(inner);
        } else {
            return null;
        }
    }

    #wrapPosition(range: FlowRange | null): FlowSelection | null {
        if (range && range.size === 1) {
            return this.set("position", range.first);
        } else {
            return null;
        }
    }

    #wrapSelection(inner: FlowSelection | null): FlowSelection | null {
        if (inner) {
            return this.setInnerSelection(inner);
        } else {
            return null;
        }
    }
}
