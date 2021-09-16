import { JsonValue, lazyType } from "paratype";
import { ParagraphStyleVariant } from ".";
import { FlowThemeRegistry } from "./internal/class-registry";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextStyle } from "./TextStyle";

/**
 * Provides a theme for flow content
 * @public
 */
export abstract class FlowTheme {
    /** The run-time type that represents this class */
    public static readonly classType = lazyType(FlowThemeRegistry.close);

    /** Converts the specified JSON value to a flow theme */
    public static fromJsonValue(value: JsonValue): FlowTheme {
        return FlowTheme.classType.fromJsonValue(value);
    }

    /** Converts the current theme to a JSON value */
    public toJsonValue(): JsonValue {
        return FlowTheme.classType.toJsonValue(this);
    }

    /** Gets a flow theme for the specified paragraph variant */
    abstract getParagraphTheme(variant: ParagraphStyleVariant): FlowTheme;

    /** Gets the ambient text style */
    abstract getAmbientTextStyle(): TextStyle;

    /** Gets the ambient paragraph style */
    abstract getAmbientParagraphStyle(): ParagraphStyle;
}
