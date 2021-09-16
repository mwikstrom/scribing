import { JsonValue } from "paratype";
import { flowNodeType } from "./internal/node-registry";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextStyle } from "./TextStyle";

/**
 * A piece of flow content.
 * @public
 */
export abstract class FlowNode {
    /** Converts the specified JSON value to a flow node */
    public static fromJsonValue(value: JsonValue): FlowNode {
        return flowNodeType.fromJsonValue(value);
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

    /** Converts the current flow node to data */
    abstract toData(): unknown;

    /** Converts the current flow node to a JSON value */
    toJsonValue(): JsonValue {
        return flowNodeType.toJsonValue(this);
    }

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

    /**
     * Gets text style from the current node
     * @internal
     */
    abstract getTextStyle(): TextStyle | null;

    /**
     * Gets paragraph style from the current node
     * @internal
     */
    abstract getParagraphStyle(): ParagraphStyle | null;
}
