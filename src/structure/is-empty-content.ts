import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { FlowContent } from "./FlowContent";

/** @public */
export function isEmptyFlowContent(content: FlowContent | null | undefined): boolean {
    if (!content) {
        return true;
    }
    const { nodes } = content;
    if (nodes.length < 1) {
        return true;
    } else if (nodes.length > 1) {
        return false;
    } else {
        return nodes[0] instanceof ParagraphBreak;
    }
}