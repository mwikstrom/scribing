import { Interaction } from "../interaction/Interaction";
import { RunScript } from "../interaction/RunScript";
import { AttrValue } from "../nodes/AttrValue";
import { DynamicText } from "../nodes/DynamicText";
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { EndMarkup } from "../nodes/EndMarkup";
import { FlowBox } from "../nodes/FlowBox";
import { FlowIcon } from "../nodes/FlowIcon";
import { FlowImage } from "../nodes/FlowImage";
import { FlowNode } from "../nodes/FlowNode";
import { FlowTable } from "../nodes/FlowTable";
import { FlowVideo } from "../nodes/FlowVideo";
import { InlineNode } from "../nodes/InlineNode";
import { LineBreak } from "../nodes/LineBreak";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { StartMarkup } from "../nodes/StartMarkup";
import { TextRun } from "../nodes/TextRun";
import { BoxStyle } from "../styles/BoxStyle";
import { TextStyle } from "../styles/TextStyle";
import { FlowContent } from "./FlowContent";
import { FlowTableContent } from "./FlowTableContent";
import { GenericFlowNodeVisitor } from "./GenericFlowNodeVisitor";
import { Script } from "./Script";

/**
 * An asynchronous visitor for flow content
 * @public
 */
export class AsyncFlowNodeVisitor implements GenericFlowNodeVisitor<Promise<FlowNode>> {
    visitNode(node: FlowNode): Promise<FlowNode> {
        return node.accept(this);
    }

    async visitFlowContent(content: FlowContent): Promise<FlowContent> {
        let changed = false;
        const nodes: FlowNode[] = [];
        for (const before of content.nodes) {
            const after = await this.visitNode(before);
            if (after !== before) {
                changed = true;
            }
            nodes.push(after);
        }
        if (changed) {
            return FlowContent.fromData(nodes);
        } else {
            return content;
        }
    }

    async visitDynamicText(node: DynamicText): Promise<FlowNode> {
        node = await this.visitInline(node);
        const visitedExpression = await this.visitScript(node.expression);
        if (visitedExpression !== node.expression) {
            return node.set("expression", visitedExpression);
        } else {
            return node;
        }
    }

    async visitEmptyMarkup(node: EmptyMarkup): Promise<FlowNode> {
        node = await this.visitInline(node);
        const visitedAttr = await this.visitAttributeMap(node.attr);
        if (visitedAttr !== node.attr) {
            return node.set("attr", visitedAttr);
        } else {
            return node;
        }
    }

    async visitEndMarkup(node: EndMarkup): Promise<FlowNode> {
        return await this.visitInline(node);
    }

    async visitBox(node: FlowBox): Promise<FlowNode> {
        const { content: contentBefore, style: styleBefore } = node;
        const contentAfter = await this.visitFlowContent(contentBefore);
        const styleAfter = await this.visitBoxStyle(styleBefore);

        if (contentAfter !== contentBefore) {
            node = node.set("content", contentAfter);
        }

        if (styleAfter !== styleBefore) {
            node = node.set("style", styleAfter);
        }

        return node;
    }

    async visitIcon(node: FlowIcon): Promise<FlowNode> {
        return await this.visitInline(node);
    }

    async visitImage(node: FlowImage): Promise<FlowNode> {
        return await this.visitInline(node);
    }

    async visitVideo(node: FlowVideo): Promise<FlowNode> {
        return await this.visitInline(node);
    }

    async visitTable(node: FlowTable): Promise<FlowNode> {
        const { content: before } = node;
        const after = await this.visitTableContent(before);
        if (after === before) {
            return node;
        } else {
            return node.set("content", after);
        }
    }

    async visitTableContent(content: FlowTableContent): Promise<FlowTableContent> {
        return content.updateAllContentAsync(cellContent => this.visitFlowContent(cellContent));
    }

    async visitLineBreak(node: LineBreak): Promise<FlowNode> {
        return await this.visitInline(node);
    }

    visitParagraphBreak(node: ParagraphBreak): Promise<FlowNode> {
        return Promise.resolve(node);
    }

    async visitStartMarkup(node: StartMarkup): Promise<FlowNode> {
        node = await this.visitInline(node);
        const visitedAttr = await this.visitAttributeMap(node.attr);
        if (visitedAttr !== node.attr) {
            return node.set("attr", visitedAttr);
        } else {
            return node;
        }
    }

    async visitTextRun(node: TextRun): Promise<FlowNode> {
        return await this.visitInline(node);
    }

    async visitInline<T extends InlineNode>(node: T): Promise<T> {
        const visited = await this.visitTextStyle(node.style);
        if (visited !== node.style) {
            return node.set("style", visited);
        } else {
            return node;
        }
    }

    async visitTextStyle(style: TextStyle): Promise<TextStyle> {
        const { link: linkBefore } = style;

        if (linkBefore) {
            const linkAfter = await this.visitInteraction(linkBefore);
            if (linkAfter !== linkBefore) {
                style = style.set("link", linkAfter);
            }
        }

        return style;
    }

    async visitBoxStyle(style: BoxStyle): Promise<BoxStyle> {
        const { source: sourceBefore, interaction: interactionBefore } = style;

        if (sourceBefore) {
            const sourceAfter = await this.visitScript(sourceBefore);
            if (sourceAfter !== sourceBefore) {
                style = style.set("source", sourceAfter);
            }
        }

        if (interactionBefore) {
            const interactionAfter = await this.visitInteraction(interactionBefore);
            if (interactionAfter !== interactionBefore) {
                style = style.set("interaction", interactionAfter);
            }
        }

        return style;
    }

    async visitInteraction(interaction: Interaction): Promise<Interaction> {
        if (interaction instanceof RunScript) {
            const visited = await this.visitScript(interaction.script);
            if (visited !== interaction.script) {
                return interaction.set("script", visited);
            }
        }
        return interaction;
    }

    async visitAttributeMap(attr: Map<string, AttrValue>): Promise<Map<string, AttrValue> | Map<string, AttrValue>> {
        const replacement = new Map<string, AttrValue>();
        let modified = false;

        for (const [key, value] of attr) {
            const visited = await this.visitAttributeValue(value);
            replacement.set(key, visited);
            if (!modified && visited !== value) {
                modified = true;
            }
        }

        if (modified) {
            return replacement;
        } else {
            return attr;
        }
    }

    async visitAttributeValue(value: AttrValue): Promise<AttrValue> {
        if (value instanceof Script) {
            return await this.visitScript(value);
        } else {
            return value;
        }
    }

    visitScript(script: Script): Promise<Script> {
        return Promise.resolve(script);
    }
}
