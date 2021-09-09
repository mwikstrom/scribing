import { JsonValue } from "paratype";
import { FlowBatch } from "./FlowBatch";
import { FlowContent } from "./FlowContent";
import { FlowRange } from "./FlowRange";
import { flowOperationType } from "./internal/operation-registry";

/**
 * An abstraction of an operation that updates flow content.
 * @public
 */
export abstract class FlowOperation {
    public static fromJsonValue(value: JsonValue): FlowOperation {
        return flowOperationType.fromJsonValue(value);
    }

    static fromArray(operations: FlowOperation[]): FlowOperation | null {
        if (operations.length === 0) {
            return null;
        } else if (operations.length === 1) {
            return operations[0];
        } else {
            Object.freeze(operations);
            return new FlowBatch({ operations });
        }
    }

    /**
     * Returns an operation that negates the effect of the current operation.
     *
     * @param state - The state, before the current operation is applied, that shall be used to compute an inverse.
     * @returns An inverse of the current operation, or `null` when the current operation cannot be inverted with
     *          respect to the supplied state.
     */
    abstract invert(state: FlowContent): FlowOperation | null;

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
     * @param state - The flow content that shall be updated.
     */
    abstract applyTo(state: FlowContent): FlowContent;

    abstract toData(): unknown;

    toJsonValue(): JsonValue {
        return flowOperationType.toJsonValue(this);
    }

    /** @internal */
    abstract afterInsertion(other: FlowRange): FlowOperation | null;

    /** @internal */
    abstract afterRemoval(other: FlowRange): FlowOperation | null;
}
