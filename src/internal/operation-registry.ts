import { lazyType, Type, unionType } from "paratype";
import { FlowOperation } from "../FlowOperation";

/** @internal */
export interface FlowOperationClass {
    readonly classType: Type<FlowOperation>;
}

/** @internal */
export const registerOperation = (target: FlowOperationClass): void => {
    if (Object.isFrozen(classTypes)) {
        throw new Error("Operation registration is closed");
    }
    classTypes.push(lazyType(() => target.classType));
};

/**
 * A run-time type that represent flow operations.
 * @internal
 */
export const flowOperationType: Type<FlowOperation> = lazyType(() => unionType(...Object.freeze(classTypes)));

const classTypes: Type<FlowOperation>[] = [];
