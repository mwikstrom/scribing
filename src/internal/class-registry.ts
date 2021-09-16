import { Type, unionType } from "paratype";
import { FlowNode } from "../FlowNode";
import { FlowOperation } from "../FlowOperation";
import { FlowSelection } from "../FlowSelection";
import { FlowTheme } from "../FlowTheme";

/** @internal */
export interface RegistrableClass<T> {
    readonly name: string;
    readonly classType: Type<T>;
}

/** @internal */
export class ClassRegistry<T> {
    readonly #union = new Set<RegistrableClass<T>>();
    #type: Type<T> | undefined;

    get type(): Type<T> {
        if (!this.#type) {
            this.#type = unionType(...Array.from(this.#union).map(r => r.classType));
        }
        return this.#type;
    }

    register = (target: RegistrableClass<T>): void => {
        if (this.#type) {
            throw new Error(`Cannot register ${target.name} after closing registration`);
        }
        this.#union.add(target);
    }
}

/** @internal */
export const FlowNodeRegistry = new ClassRegistry<FlowNode>();

/** @internal */
export const FlowOperationRegistry = new ClassRegistry<FlowOperation>();

/** @internal */
export const FlowSelectionRegistry = new ClassRegistry<FlowSelection>();

/** @internal */
export const FlowThemeRegistry = new ClassRegistry<FlowTheme>();