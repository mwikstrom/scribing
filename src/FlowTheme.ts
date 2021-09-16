import { ParagraphBreak } from "./ParagraphBreak";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextStyle } from "./TextStyle";

/**
 * Provides a theme for flow content
 * @public
 */
export abstract class FlowTheme {
    /** Gets a flow theme for the specified paragraph break */
    abstract getParagraphTheme(breakNode: ParagraphBreak | null): FlowTheme;

    /** Gets the ambient text style */
    abstract getAmbientTextStyle(): TextStyle;

    /** Gets the ambient paragraph style */
    abstract getAmbientParagraphStyle(): ParagraphStyle;
}