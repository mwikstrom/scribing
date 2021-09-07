import { JsonValue } from "paratype";
import { flowNodeType } from "./internal/node-registry";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextStyle } from "./TextStyle";

/**
 * A piece of flow content.
 * @public
 */
export abstract class FlowNode {
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

    abstract toData(): unknown;

    toJsonValue(): JsonValue {
        return flowNodeType.toJsonValue(this);
    }

    /** @internal */
    abstract getTextStyle(): TextStyle | null;

    /** @internal */
    abstract getParagraphStyle(): ParagraphStyle | null;
}
