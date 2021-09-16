import { ParagraphStyleVariant } from ".";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextStyle } from "./TextStyle";

/**
 * Provides a theme for flow content
 * @public
 */
export abstract class FlowTheme {
    /** Gets a flow theme for the specified paragraph variant */
    abstract getParagraphTheme(variant: ParagraphStyleVariant): FlowTheme;

    /** Gets the ambient text style */
    abstract getAmbientTextStyle(): TextStyle;

    /** Gets the ambient paragraph style */
    abstract getAmbientParagraphStyle(): ParagraphStyle;
}
