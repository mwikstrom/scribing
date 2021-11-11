import { JsonValue, lazyType } from "paratype";
import { BoxStyle } from "./BoxStyle";
import { FlowThemeRegistry } from "../internal/class-registry";
import { ParagraphVariant } from "./ParagraphStyle";
import { ParagraphTheme } from "./ParagraphTheme";

/**
 * Provides a theme for flow content
 * @public
 */
export abstract class FlowTheme {
    /** The run-time type that represents the base class */
    public static readonly baseType = lazyType(FlowThemeRegistry.close);

    /** Converts the specified JSON value to a flow theme */
    public static fromJsonValue(value: JsonValue): FlowTheme {
        return FlowTheme.baseType.fromJsonValue(value);
    }

    /** Converts the current theme to a JSON value */
    public toJsonValue(): JsonValue {
        return FlowTheme.baseType.toJsonValue(this);
    }

    /** Gets a theme for the specified paragraph variant */
    abstract getParagraphTheme(variant: ParagraphVariant): ParagraphTheme;

    /** Gets a theme for the specified box style */
    abstract getBoxTheme(style: BoxStyle): FlowTheme;
}
