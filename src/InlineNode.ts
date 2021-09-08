import { FlowNode } from "./FlowNode";
import { TextStyle } from "./TextStyle";

/**
 * Represents an inline node
 * @public
 */
export abstract class InlineNode extends FlowNode {
    public abstract readonly style: TextStyle;

    public formatText(style: TextStyle): this {
        return this.set("style", this.style.merge(style));
    }

    public formatParagraph(): this {
        return this;
    }

    public abstract set(key: "style", value: TextStyle): this;

    public unformatText(style: TextStyle): this {
        return this.set("style", this.style.unmerge(style));
    }

    /** {@inheritdoc FlowNode.getTextStyle} */
    getTextStyle(): TextStyle {
        return this.style;
    }

    /** {@inheritdoc FlowNode.getParagraphStyle} */
    getParagraphStyle(): null {
        return null;
    }
}
