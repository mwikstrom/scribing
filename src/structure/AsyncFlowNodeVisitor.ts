import { DynamicText } from "../nodes/DynamicText";
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { EndMarkup } from "../nodes/EndMarkup";
import { FlowBox } from "../nodes/FlowBox";
import { FlowIcon } from "../nodes/FlowIcon";
import { FlowImage } from "../nodes/FlowImage";
import { FlowNode } from "../nodes/FlowNode";
import { FlowTable } from "../nodes/FlowTable";
import { LineBreak } from "../nodes/LineBreak";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { StartMarkup } from "../nodes/StartMarkup";
import { TextRun } from "../nodes/TextRun";
import { FlowContent } from "./FlowContent";
import { FlowTableContent } from "./FlowTableContent";
import { GenericFlowNodeVisitor } from "./GenericFlowNodeVisitor";

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

    visitDynamicText(node: DynamicText): Promise<FlowNode> {
        return Promise.resolve(node);
    }

    visitEmptyMarkup(node: EmptyMarkup): Promise<FlowNode> {
        return Promise.resolve(node);
    }

    visitEndMarkup(node: EndMarkup): Promise<FlowNode> {
        return Promise.resolve(node);
    }

    async visitBox(node: FlowBox): Promise<FlowNode> {
        const { content: before } = node;
        const after = await this.visitFlowContent(before);
        if (after === before) {
            return node;
        } else {
            return node.set("content", after);
        }
    }

    visitIcon(node: FlowIcon): Promise<FlowNode> {
        return Promise.resolve(node);
    }

    visitImage(node: FlowImage): Promise<FlowNode> {
        return Promise.resolve(node);
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

    visitLineBreak(node: LineBreak): Promise<FlowNode> {
        return Promise.resolve(node);
    }

    visitParagraphBreak(node: ParagraphBreak): Promise<FlowNode> {
        return Promise.resolve(node);
    }

    visitStartMarkup(node: StartMarkup): Promise<FlowNode> {
        return Promise.resolve(node);
    }

    visitTextRun(node: TextRun): Promise<FlowNode> {
        return Promise.resolve(node);
    }
}
