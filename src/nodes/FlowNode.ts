import { JsonValue, lazyType } from "paratype";
import { BoxStyle } from "../styles/BoxStyle";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowNodeRegistry } from "../internal/class-registry";
import { ParagraphStyle, ParagraphStyleProps } from "../styles/ParagraphStyle";
import { ParagraphTheme } from "../styles/ParagraphTheme";
import { TextStyle, TextStyleProps } from "../styles/TextStyle";

/**
 * A piece of flow content.
 * @public
 */
export abstract class FlowNode {
    /** The run-time type that represents the base class */
    public static readonly baseType = lazyType(FlowNodeRegistry.close);

    /** Converts the specified JSON value to a flow node */
    public static fromJsonValue(value: JsonValue): FlowNode {
        return FlowNode.baseType.fromJsonValue(value);
    }
    
    /**
     * Size of the current node.
     * 
     * @remarks
     * The size of flow content is measured in UTF-16 characters and all nodes,
     * except {@link TextRun|text runs}, are defined to have size 1.
     */
    abstract readonly size: number;

    /**
     * Marks the specified upload as completed
     * @param id - Identifies the completed upload
     * @param url - URL of the uploaded resource
     */
    abstract completeUpload(id: string, url: string): FlowNode;

    /**
     * Applies the specified box style on the current node and returns the updated node.
     * @param style - The box style to apply
     * @param theme - Theme of the current content
     */
    abstract formatBox(style: BoxStyle, theme?: FlowTheme): FlowNode;

    /**
     * Applies the specified paragraph style on the current node and returns the updated node.
     * @param style - The paragraph style to apply
     * @param theme - Theme of the current content
     */
    abstract formatParagraph(style: ParagraphStyle, theme?: FlowTheme): FlowNode;

    /**
     * Applies the specified text style on the current node and returns the updated node.
     * @param style - The text style to apply
     * @param theme - Theme of the current content
     */
    abstract formatText(style: TextStyle, theme?: FlowTheme): FlowNode;

    /**
     * Gets a uniform paragraph style from the current node
     * @param theme - Theme of the current node
     * @param diff - An optional set that is populated with style keys with non-uniform values
     */
    abstract getUniformParagraphStyle(
        theme?: ParagraphTheme, 
        diff?: Set<keyof ParagraphStyleProps>,
    ): ParagraphStyle | null;

    /**
     * Gets a uniform text style from the current node
     * @param theme - Theme of the current node
     * @param diff - An optional set that is populated with style keys with non-uniform values
     */
    abstract getUniformTextStyle(
        theme?: ParagraphTheme, 
        diff?: Set<keyof TextStyleProps>,
    ): TextStyle | null;

    /** Converts the current flow node to data */
    abstract toData(): unknown;

    /** Converts the current flow node to a JSON value */
    toJsonValue(): JsonValue {
        return FlowNode.baseType.toJsonValue(this);
    }

    /**
     * Unapplies the ambient style of the specified theme from the current node and returns the updated node.
     * @param theme - The theme that provides ambient styling
     */
    abstract unformatAmbient(theme: ParagraphTheme): FlowNode;

    /**
     * Unapplies the specified box style from the current node and returns the updated node.
     * @param style - The box style to unapply
     */
    abstract unformatBox(style: BoxStyle): FlowNode;

    /**
     * Unapplies the specified paragraph style from the current node and returns the updated node.
     * @param style - The paragraph style to unapply
     */
    abstract unformatParagraph(style: ParagraphStyle): FlowNode;

    /**
     * Unapplies the specified text style from the current node and returns the updated node.
     * @param style - The text style to unapply
     */
    abstract unformatText(style: TextStyle): FlowNode;
}
