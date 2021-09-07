import { lazyType, Type, unionType } from "paratype";
import { FlowNode } from "../FlowNode";

/** @internal */
export interface FlowNodeClass {
    readonly classType: Type<FlowNode>;
}

/** @internal */
export const registerNode = (target: FlowNodeClass): void => {
    if (Object.isFrozen(classTypes)) {
        throw new Error("Node registration is closed");
    }
    classTypes.push(lazyType(() => target.classType));
};

/**
 * A run-time type that represent flow nodes.
 * @internal
 */
export const flowNodeType: Type<FlowNode> = lazyType(() => unionType(...Object.freeze(classTypes)));

const classTypes: Type<FlowNode>[] = [];
