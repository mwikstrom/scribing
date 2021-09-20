import { ParagraphStyle } from "./ParagraphStyle";
import { TextStyle } from "./TextStyle";

/**
 * Provides a theme for paragraph content
 * @public
 */
export abstract class ParagraphTheme {
    /**
     * Gets the ambient text style for this paragraph theme.
     */
    abstract getAmbientTextStyle(): TextStyle;

    /**
     * Gets the ambient paragraph style
     * @remarks
     * The paragraph theme is defined per paragraph style variant, and therefore
     * the ambient paragraph style returned from this method must not specify a
     * paragraph style variant.
     */
    abstract getAmbientParagraphStyle(): ParagraphStyle;
}
