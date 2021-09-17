import { JsonValue, lazyType } from "paratype";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelectionRegistry } from "./internal/class-registry";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextStyle } from "./TextStyle";

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

    /**
     * Creates an operation that applies the specified paragraph style on the current selection
     * @param style - The style to apply
     * @remarks
     * `null` is returns when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract formatParagraph(style: ParagraphStyle): FlowOperation | null;

    /**
     * Creates an operation that applies the specified text style on the current selection
     * @param style - The style to apply
     * @remarks
     * `null` is returns when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract formatText(style: TextStyle): FlowOperation | null;

    /**
     * Creates an operation that inserts the specified content into the current selection
     * @param content - The content to be inserted
     * @remarks
     * `null` is returns when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract insert(content: FlowContent): FlowOperation | null;

    /**
     * Creates an operation that removes the content of the current selection
     * @remarks
     * `null` is returns when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract remove(): FlowOperation | null;

    /**
     * Creates an operation that unapplies the specified paragraph style on the current selection
     * @param style - The style to unapply
     * @remarks
     * `null` is returns when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract unformatParagraph(style: ParagraphStyle): FlowOperation | null;

    /**
     * Creates an operation that unapplies the specified text style on the current selection
     * @param style - The style to unapply
     * @remarks
     * `null` is returns when the operation would be a no-op or not applicable on the current selection.
     */
    public abstract unformatText(style: TextStyle): FlowOperation | null;

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
