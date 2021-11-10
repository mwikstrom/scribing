import { Type, unionType } from "paratype";
import { FlowNode } from "../nodes/FlowNode";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowTheme } from "../styles/FlowTheme";
import { Interaction } from "../interaction/Interaction";

/** @internal */
export interface RegistrableClass<T> {
    readonly name: string;
    readonly classType: Type<T>;
}

/** @internal */
export class ClassRegistry<T> {
    readonly #union = new Set<RegistrableClass<T>>();
    #closed: Type<T> | undefined;

    close = (): Type<T> => {
        if (!this.#closed) {
            this.#closed = unionType(...Array.from(this.#union).map(r => r.classType));
        }
        return this.#closed;
    }

    register = (target: RegistrableClass<T>): void => {
        if (this.#closed) {
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

/** @internal */
export const InteractionRegistry = new ClassRegistry<Interaction>();
