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
        return node;
    }

    visitEmptyMarkup(node: EmptyMarkup): FlowNode {
        return node;
    }

    visitEndMarkup(node: EndMarkup): FlowNode {
        return node;
    }

    visitBox(node: FlowBox): FlowNode {
        const { content: before } = node;
        const after = this.visitFlowContent(before);
        if (after === before) {
            return node;
        } else {
            return node.set("content", after);
        }
    }

    visitIcon(node: FlowIcon): FlowNode {
        return node;
    }

    visitImage(node: FlowImage): FlowNode {
        return node;
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
        return node;
    }

    visitParagraphBreak(node: ParagraphBreak): FlowNode {
        return node;
    }

    visitStartMarkup(node: StartMarkup): FlowNode {
        return node;
    }

    visitTextRun(node: TextRun): FlowNode {
        return node;
    }
}
