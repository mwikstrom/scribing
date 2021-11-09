import { FlowNode } from "./FlowNode";
import { ParagraphStyle } from "./ParagraphStyle";
import { ParagraphTheme } from "./ParagraphTheme";
import { TextStyle } from "./TextStyle";

/**
 * Represents an inline node
 * @public
 */
export abstract class InlineNode extends FlowNode {
    /** The text style of the current node */
    public abstract readonly style: TextStyle;

    /** {@inheritdoc FlowNode.completeUpload} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public completeUpload(id: string, url: string): FlowNode {
        return this;
    }

    /** {@inheritdoc FlowNode.formatBox} */
    public formatBox(): this {
        return this;
    }

    /** {@inheritdoc FlowNode.formatText} */
    public formatText(style: TextStyle): this {
        return this.set("style", this.style.merge(style));
    }

    /** {@inheritdoc FlowNode.formatParagraph} */
    public formatParagraph(): this {
        return this;
    }

    /**
     * {@inheritDoc FlowNode.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(): ParagraphStyle | null {
        return null;
    }

    /**
     * {@inheritDoc FlowNode.getUniformTextStyle}
     * @override
     */
    public getUniformTextStyle(theme?: ParagraphTheme): TextStyle {
        let { style } = this;
        
        if (style.link && theme) {
            style = theme.getLinkStyle().merge(style);
        }

        const ambient = this.#getAmbientStyle(theme);
        return ambient.isEmpty ? style : ambient.merge(style);
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
    public unformatAmbient(theme: ParagraphTheme): this {
        const ambient = this.#getAmbientStyle(theme);
        return this.unformatText(ambient);
    }

    /** {@inheritdoc FlowNode.unformatBox} */
    public unformatBox(): this {
        return this;
    }

    /** {@inheritdoc FlowNode.unformatText} */
    public unformatText(style: TextStyle): this {
        return this.set("style", this.style.unmerge(style));
    }

    /** {@inheritdoc FlowNode.unformatParagraph} */
    public unformatParagraph(): this {
        return this;
    }

    #getAmbientStyle(theme?: ParagraphTheme): TextStyle {
        let ambient = theme?.getAmbientTextStyle() ?? TextStyle.empty;

        if (this.style.link) {
            const linkStyle = theme?.getLinkStyle();
            if (linkStyle) {
                ambient = ambient.merge(linkStyle);
            }
        }

        return ambient;
    }
}
