import { JsonValue, lazyType } from "paratype";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowContent } from "../structure/FlowContent";
import { FlowRange } from "../selection/FlowRange";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowOperationRegistry } from "../internal/class-registry";

/**
 * An abstraction of an operation that updates flow content.
 * @public
 */
export abstract class FlowOperation {
    /** The run-time type that represents the base class */
    public static readonly baseType = lazyType(FlowOperationRegistry.close);

    /** Converts the specified JSON value to a flow operation */
    public static fromJsonValue(value: JsonValue): FlowOperation {
        return FlowOperation.baseType.fromJsonValue(value);
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
     * Returns an operation that keeps the intention of the current operation and the specified subsequent
     * operation as they were performed as an atomic operation.
     * @param next - The next operation to be merged
     * @remarks
     * Although a batch operation can fulfill the purpose of keeping the intent of both operations, the
     * idea is that this method shall NOT return a batch, but only return a non-null result when the
     * current operation can be rewritten to include the intention of the subsequent operation too.
     */
    abstract mergeNext(next: FlowOperation): FlowOperation | null;

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
        return FlowOperation.baseType.toJsonValue(this);
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
