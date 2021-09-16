import { FlowNode } from "./FlowNode";
import { FlowTheme } from "./FlowTheme";
import { TextStyle } from "./TextStyle";

/**
 * Represents an inline node
 * @public
 */
export abstract class InlineNode extends FlowNode {
    /** The text style of the current node */
    public abstract readonly style: TextStyle;

    /** {@inheritdoc FlowNode.formatText} */
    public formatText(style: TextStyle): this {
        return this.set("style", this.style.merge(style));
    }

    /** {@inheritdoc FlowNode.formatParagraph} */
    public formatParagraph(): this {
        return this;
    }

    /**
     * Returns a copy of the current object with the specified property merged in
     *
     * @param key - Key of the property to merge in
     * @param value - Property value to merge in
     *
     * @remarks
     * If the resulting object would be equal to the current instance, then the current
     * instance is returned instead.
     */
    public abstract set(key: "style", value: TextStyle): this;

    /** {@inheritdoc FlowNode.unformatAmbient} */
    public unformatAmbient(theme: FlowTheme): this {
        return this.unformatText(theme.getAmbientTextStyle());
    }

    /** {@inheritdoc FlowNode.unformatText} */
    public unformatText(style: TextStyle): this {
        return this.set("style", this.style.unmerge(style));
    }

    /** {@inheritdoc FlowNode.unformatParagraph} */
    public unformatParagraph(): this {
        return this;
    }
}
