import { JsonValue, lazyType } from "paratype";
import { InteractionRegistry } from "../internal/class-registry";

/**
 * A base class for interactions
 * @public
 */
export abstract class Interaction {
    /** The run-time type that represents the base class */
    public static readonly baseType = lazyType(InteractionRegistry.close);

    /** Converts the specified JSON value to an interaction */
    public static fromJsonValue(value: JsonValue): Interaction {
        return Interaction.baseType.fromJsonValue(value);
    }

    /** Converts the current interaction to a JSON value */
    public toJsonValue(): JsonValue {
        return Interaction.baseType.toJsonValue(this);
    }
}
