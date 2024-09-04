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
 * A visitor for flow content
 * @public
 */
export class FlowNodeVisitor implements GenericFlowNodeVisitor<FlowNode> {
    visitNode(node: FlowNode): FlowNode {
        return node.accept(this);
    }

    visitFlowContent(content: FlowContent): FlowContent {
        let changed = false;
        const nodes = content.nodes.map(before => {
            const after = this.visitNode(before);
            if (after !== before) {
                changed = true;
            }
            return after;
        });
        if (changed) {
            return FlowContent.fromData(nodes);
        } else {
            return content;
        }
    }

    visitDynamicText(node: DynamicText): FlowNode {
        node = this.visitInline(node);
        const visitedExpression = this.visitScript(node.expression);
        if (visitedExpression !== node.expression) {
            return node.set("expression", visitedExpression);
        } else {
            return node;
        }
    }

    visitEmptyMarkup(node: EmptyMarkup): FlowNode {
        node = this.visitInline(node);
        const visitedAttr = this.visitAttributeMap(node.attr);
        if (visitedAttr !== node.attr) {
            return node.set("attr", visitedAttr);
        } else {
            return node;
        }
    }

    visitEndMarkup(node: EndMarkup): FlowNode {
        return this.visitInline(node);
    }

    visitBox(node: FlowBox): FlowNode {
        const { content: contentBefore, style: styleBefore } = node;
        const contentAfter = this.visitFlowContent(contentBefore);
        const styleAfter = this.visitBoxStyle(styleBefore);

        if (contentAfter !== contentBefore) {
            node = node.set("content", contentAfter);
        }

        if (styleAfter !== styleBefore) {
            node = node.set("style", styleAfter);
        }

        return node;
    }

    visitIcon(node: FlowIcon): FlowNode {
        return this.visitInline(node);
    }

    visitImage(node: FlowImage): FlowNode {
        return this.visitInline(node);
    }

    visitVideo(node: FlowVideo): FlowNode {
        return this.visitInline(node);
    }

    visitTable(node: FlowTable): FlowNode {
        const { content: before } = node;
        const after = this.visitTableContent(before);
        if (after === before) {
            return node;
        } else {
            return node.set("content", after);
        }
    }

    visitTableContent(content: FlowTableContent): FlowTableContent {
        return content.updateAllContent(cellContent => this.visitFlowContent(cellContent));
    }

    visitLineBreak(node: LineBreak): FlowNode {
        return this.visitInline(node);
    }

    visitParagraphBreak(node: ParagraphBreak): FlowNode {
        return node;
    }

    visitStartMarkup(node: StartMarkup): FlowNode {
        node = this.visitInline(node);
        const visitedAttr = this.visitAttributeMap(node.attr);
        if (visitedAttr !== node.attr) {
            return node.set("attr", visitedAttr);
        } else {
            return node;
        }
    }

    visitTextRun(node: TextRun): FlowNode {
        return this.visitInline(node);
    }

    visitInline<T extends InlineNode>(node: T): T {
        const visited = this.visitTextStyle(node.style);
        if (visited !== node.style) {
            return node.set("style", visited);
        } else {
            return node;
        }
    }

    visitTextStyle(style: TextStyle): TextStyle {
        const { link: linkBefore } = style;

        if (linkBefore) {
            const linkAfter = this.visitInteraction(linkBefore);
            if (linkAfter !== linkBefore) {
                style = style.set("link", linkAfter);
            }
        }

        return style;
    }

    visitBoxStyle(style: BoxStyle): BoxStyle {
        const { source: sourceBefore, interaction: interactionBefore } = style;

        if (sourceBefore) {
            const sourceAfter = this.visitScript(sourceBefore);
            if (sourceAfter !== sourceBefore) {
                style = style.set("source", sourceAfter);
            }
        }

        if (interactionBefore) {
            const interactionAfter = this.visitInteraction(interactionBefore);
            if (interactionAfter !== interactionBefore) {
                style = style.set("interaction", interactionAfter);
            }
        }

        return style;
    }

    visitInteraction(interaction: Interaction): Interaction {
        if (interaction instanceof RunScript) {
            const visited = this.visitScript(interaction.script);
            if (visited !== interaction.script) {
                return interaction.set("script", visited);
            }
        }
        return interaction;
    }

    visitAttributeMap(attr: Map<string, AttrValue>): Map<string, AttrValue> {
        const replacement = new Map<string, AttrValue>();
        let modified = false;

        for (const [key, value] of attr) {
            const visited = this.visitAttributeValue(value);
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

    visitAttributeValue(value: AttrValue): AttrValue {
        if (value instanceof Script) {
            return this.visitScript(value);
        } else {
            return value;
        }
    }

    visitScript(script: Script): Script {
        return script;
    }
}
