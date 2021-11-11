import { JsonValue, lazyType } from "paratype";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelectionRegistry } from "../internal/class-registry";
import { ParagraphStyle, ParagraphStyleProps } from "../styles/ParagraphStyle";
import { TextStyle, TextStyleProps } from "../styles/TextStyle";
import { BoxStyle, BoxStyleProps } from "../styles/BoxStyle";
import { ImageSource } from "../structure/ImageSource";
import { TableStyle } from "../styles/TableStyle";
import { TableColumnStyle } from "../styles/TableColumnStyle";

/**
 * Represents a selection of flow content
 * @public
 */
export abstract class FlowSelection {
    /** The run-time type that represents the base class */
    public static readonly baseType = lazyType(FlowSelectionRegistry.close);

    /** Converts the specified JSON value to a flow selection */
    public static fromJsonValue(value: JsonValue): FlowSelection {
        return FlowSelection.baseType.fromJsonValue(value);
    }

    /** Converts the current selection to a JSON value */
    public toJsonValue(): JsonValue {
        return FlowSelection.baseType.toJsonValue(this);
    }

    /** Determines whether the current selection is collapsed */
    public abstract get isCollapsed(): boolean;

    /**
     * Gets the uniform box style of the current selection
     * @param content - The selected content
     * @param theme - Theme of the selected content
     * @param diff - An optional set that is populated with style keys with non-uniform values
     */
    public abstract getUniformBoxStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof BoxStyleProps>,
    ): BoxStyle;

    /**
     * Gets the uniform paragraph style of the current selection
     * @param content - The selected content
     * @param theme - Theme of the selected content
     * @param diff - An optional set that is populated with style keys with non-uniform values
     */
    public abstract getUniformParagraphStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof ParagraphStyleProps>,
    ): ParagraphStyle;

    /**
     * Gets the uniform text style of the current selection
     * @param content - The selected content
     * @param theme - Theme of the selected content
     * @param diff - An optional set that is populated with style keys with non-uniform values
     */
    public abstract getUniformTextStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof TextStyleProps>,
    ): TextStyle;
    
    /**
     * Creates an operation that decrements the list level of the current selection
     * @param content - The selected content
     * @param delta - Optional list level decrement. Default is `1`.
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public decrementListLevel(content: FlowContent, delta = 1): FlowOperation | null {
        return this.incrementListLevel(content, -delta);
    }

    /**
     * Creates an operation that applies the specified box style on the current selection
     * @param style - The style to apply
     * @param options - Options that provide operation behavior
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract formatBox(style: BoxStyle, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that applies the specified list format to the current selection.
     * @param content - The selected content
     * @param kind - The list kind to apply
     */
    public abstract formatList(content: FlowContent, kind: "ordered" | "unordered" | null): FlowOperation | null;

    /**
     * Creates an operation that applies the specified paragraph style on the current selection
     * @param style - The style to apply
     * @param options - Options that provide operation behavior
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract formatParagraph(style: ParagraphStyle, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that applies the specified text style on the current selection
     * @param style - The style to apply
     * @param options - Options that provide operation behavior
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract formatText(style: TextStyle, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that increments the list level of the current selection
     * @param content - The selected content
     * @param delta - Optional list level increment. Default is `1`.
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract incrementListLevel(content: FlowContent, delta?: number): FlowOperation | null;

    /**
     * Creates an operation that inserts the specified content into the current selection
     * @param content - The content to be inserted
     * @param options - Options that provide operation behavior
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract insert(content: FlowContent, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that removes the content of the current selection
     * @param options - Options that provide operation behavior
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract remove(options?: RemoveFlowSelectionOptions): FlowOperation | null;

    /**
     * Creates an operation that sets the specified dynamic text expression in the current selection
     * @param content - The selected content
     * @param expression - The expression to set
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract setDynamicTextExpression(content: FlowContent, expression: string): FlowOperation | null;

    /**
     * Creates an operation that sets the specified icon data in the current selection
     * @param content - The selected content
     * @param data - The icon data to set
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract setIcon(content: FlowContent, data: string): FlowOperation | null;

    /**
     * Creates an operation that sets the specified image source in the current selection
     * @param content - The selected content
     * @param source - The image source to set
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract setImageSource(content: FlowContent, source: ImageSource): FlowOperation | null;

    /**
     * Transforms all ranges in the current selection
     * @param transform - The transform to apply
     * @param options - Options that provide tranformation behavior
     */
    public abstract transformRanges(
        transform: (range: FlowRange, options?: TargetOptions) => FlowRange | null,
        options?: TargetOptions
    ): FlowSelection | null;

    /**
     * Creates an operation that unapplies the specified box style on the current selection
     * @param style - The style to unapply
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract unformatBox(style: BoxStyle, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that unapplies the specified paragraph style on the current selection
     * @param style - The style to unapply
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract unformatParagraph(style: ParagraphStyle, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that unapplies the specified text style on the current selection
     * @param style - The style to unapply
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract unformatText(style: TextStyle, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that applies the specified table style on the current selection
     * @param content - The selected content
     * @param style - The style to unapply
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract formatTable(style: TableStyle, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that unapplies the specified table style on the current selection
     * @param content - The selected content
     * @param style - The style to unapply
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract unformatTable(style: TableStyle, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that applies the specified table column style on the current selection
     * @param content - The selected content
     * @param style - The style to unapply
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract formatTableColumn(style: TableColumnStyle, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that unapplies the specified table column style on the current selection
     * @param content - The selected content
     * @param style - The style to unapply
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract unformatTableColumn(style: TableColumnStyle, options?: TargetOptions): FlowOperation | null;

    /**
     * Creates an operation that inserts a table column before the current selection.
     * @param content - The selected content
     * @param count - Optional. The number of columns to insert. Default is the number of selected columns.
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract insertTableColumnBefore(content: FlowContent, count?: number): FlowOperation | null;

    /**
     * Creates an operation that inserts a table column after the current selection.
     * @param content - The selected content
     * @param count - Optional. The number of columns to insert. Default is the number of selected columns.
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract insertTableColumnAfter(content: FlowContent, count?: number): FlowOperation | null;

    /**
     * Creates an operation that inserts a table row before the current selection.
     * @param content - The selected content
     * @param count - Optional. The number of rows to insert. Default is the number of selected rows.
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract insertTableRowBefore(content: FlowContent, count?: number): FlowOperation | null;

    /**
     * Creates an operation that inserts a table row after the current selection.
     * @param content - The selected content
     * @param count - Optional. The number of rows to insert. Default is the number of selected rows.
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract insertTableRowAfter(content: FlowContent, count?: number): FlowOperation | null;

    /**
     * Creates an operation that removes the selected table column
     * @param content - The selected content
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract removeTableColumn(content: FlowContent): FlowOperation | null;

    /**
     * Creates an operation that removes the selected table row
     * @param content - The selected content
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract removeTableRow(content: FlowContent): FlowOperation | null;

    /**
     * Creates an operation that merges the selected table cells.
     * @param content - The selected content
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract mergeTableCell(content: FlowContent): FlowOperation | null;

    /**
     * Creates an operation that splits the selected table cells (given that it is a merged cell)
     * @param content - The selected content
     * @remarks
     * `null` is returned when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract splitTableCell(content: FlowContent): FlowOperation | null;
    
    /**
     * Transforms the current selection so that its intended boundary is preserved after the specified
     * range was inserted.
     * @internal
     */
    abstract afterInsertion(range: FlowRange, mine: boolean): FlowSelection | null;

    /**
     * Transforms the current selection so that its intended boundary is preserved after the specified
     * range was removed.
     * @internal
     */
    abstract afterRemoval(range: FlowRange, mine: boolean): FlowSelection | null;
}

/**
 * Provides options for the target flow
 * @public
 */
export interface TargetOptions {
    /** The content that is selected */
    target?: FlowContent;

    /** Theme of the selected content */
    theme?: FlowTheme;
}

/**
 * Options for {@link FlowSelection.remove}
 * @public
 */
export interface RemoveFlowSelectionOptions extends TargetOptions {
    /** Controls what to remove when selection is collapsed */
    whenCollapsed?: "removeBackward" | "removeForward" | "noop";
}
