import { JsonValue } from "paratype";
import { FlowSelection } from "./FlowSelection";
import { FlowContent } from "./FlowContent";
import { FlowRange } from "./FlowRange";
import { FlowTheme } from "./FlowTheme";
import { FlowOperationRegistry } from "./internal/class-registry";

/**
 * An abstraction of an operation that updates flow content.
 * @public
 */
export abstract class FlowOperation {
    /** Converts the specified JSON value to a flow operation */
    public static fromJsonValue(value: JsonValue): FlowOperation {
        return FlowOperationRegistry.type.fromJsonValue(value);
    }

    /**
     * Returns an operation that negates the effect of the current operation.
     *
     * @param content - The state, before the current operation is applied, that shall be used to compute an inverse.
     * @returns An inverse of the current operation, or `null` when the current operation cannot be inverted with
     *          respect to the supplied state.
     */
    abstract invert(content: FlowContent): FlowOperation | null;

    /**
     * Transforms the specified operation to with respect to change implied by the current operation so that
     * the intent of the operation is retained when it is applied after the current operation.
     * 
     * @param other - The operation for which to get a transform
     * 
     * @remarks
     * The specified operation is returned when it is unaffected by the change implied by the current operation.
     * 
     * `null` is returned when the intent of the other operation is cancelled by the change implied by
     * the current operation.
     */
    abstract transform(other: FlowOperation): FlowOperation | null;

    /**
     * Applies the current operation on the specified content and returns the updated result.
     * 
     * @param content - The flow content that shall be updated.
     * @param theme - Optional theme of the content that shall be updated.
     */
    abstract applyToContent(content: FlowContent, theme?: FlowTheme): FlowContent;

    /**
     * Applies the current operation on the specified selection and returns the updated result.
     * 
     * @param selection - The selection that shall be updated.
     * @param mine - Specifies whether the current operation is executed by the same user that owns
     *               the selection.
     */
    abstract applyToSelection(selection: FlowSelection, mine: boolean): FlowSelection | null;

    /** Converts the current operation to data */
    abstract toData(): unknown;

    /** Converts the current operation to a JSON value */
    toJsonValue(): JsonValue {
        return FlowOperationRegistry.type.toJsonValue(this);
    }

    /**
     * Transforms the current operation so that its intent is preserved after the specified
     * range was inserted.
     * @internal
     */
    abstract afterInsertion(other: FlowRange): FlowOperation | null;

    /**
     * Transforms the current operation so that its intent is preserved after the specified
     * range was removed.
     * @internal
     */
     abstract afterRemoval(other: FlowRange): FlowOperation | null;
}
