import { ParagraphBreak } from "./ParagraphBreak";

/**
 * Provides a theme for flow content
 * @public
 */
export abstract class FlowTheme {
    /** Gets a flow theme for the specified paragraph break */
    abstract getParagraphTheme(breakNode: ParagraphBreak | null): FlowTheme;
}