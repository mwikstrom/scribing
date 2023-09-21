import { FlowNode } from "../nodes/FlowNode";
import { LineBreak } from "../nodes/LineBreak";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { TextRun } from "../nodes/TextRun";
import { FlowContent } from "../structure/FlowContent";

/**
 * Deserializes flow content from the specified plain text string
 * @param text - The plain text string that shall be deserialized
 * @returns Flow content
 * @public
 */
export function deserializeFlowContentFromText(
    text: string
): FlowContent {
    const nodes: FlowNode[] = [];
    const pattern = /(\r\n|[\n\v\f\r\x85\u2028\u2029])/;
    let prevEmpty = false;
    for (const line of text.replace(/\t/g, " ").split(pattern).filter(Boolean)) {
        if (!/^\s+$/.test(line)) {
            if (prevEmpty) {
                nodes.push(LineBreak.fromData({ break: "line" }));
                prevEmpty = false;
            }
            nodes.push(TextRun.fromData(TextRun.normalizeText(line)));
        } else if (prevEmpty) {
            nodes.push(ParagraphBreak.fromData({ break: "para" }));
            prevEmpty = false;
        } else {
            prevEmpty = true;
        }
    }
    return FlowContent.fromData(nodes);
}
