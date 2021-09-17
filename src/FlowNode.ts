import { JsonValue, lazyType } from "paratype";
import { FlowTheme } from "./FlowTheme";
import { FlowNodeRegistry } from "./internal/class-registry";
import { ParagraphStyle, ParagraphStyleProps } from "./ParagraphStyle";
import { TextStyle, TextStyleProps } from "./TextStyle";

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
     * Applies the specified paragraph style on the current node and returns the updated node.
     * @param style - The paragraph style to apply
     */
    abstract formatParagraph(style: ParagraphStyle): FlowNode;

    /**
     * Applies the specified text style on the current node and returns the updated node.
     * @param style - The text style to apply
     */
    abstract formatText(style: TextStyle): FlowNode;

    /**
     * Gets a uniform paragraph style from the current node
     * @param theme - Theme of the current node
     * @param diff - An optional set that is populated with style keys with non-uniform values
     */
    abstract getUniformParagraphStyle(theme?: FlowTheme, diff?: Set<keyof ParagraphStyleProps>): ParagraphStyle | null;

    /**
     * Gets a uniform text style from the current node
     * @param theme - Theme of the current node
     * @param diff - An optional set that is populated with style keys with non-uniform values
     */
    abstract getUniformTextStyle(theme?: FlowTheme, diff?: Set<keyof TextStyleProps>): TextStyle | null;

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
    abstract unformatAmbient(theme: FlowTheme): FlowNode;

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
