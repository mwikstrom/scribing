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

/**
 * A generic visitor for flow content
 * @public
 */
export interface GenericFlowNodeVisitor<T> {
    visitNode(node: FlowNode): T;

    visitDynamicText(node: DynamicText): T;

    visitEmptyMarkup(node: EmptyMarkup): T;

    visitEndMarkup(node: EndMarkup): T;

    visitBox(node: FlowBox): T;

    visitIcon(node: FlowIcon): T;

    visitImage(node: FlowImage): T;

    visitTable(node: FlowTable): T;

    visitLineBreak(node: LineBreak): T;

    visitParagraphBreak(node: ParagraphBreak): T;

    visitStartMarkup(node: StartMarkup): T;

    visitTextRun(node: TextRun): T;
}
