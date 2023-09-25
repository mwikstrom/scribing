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
    const lineArray = text.replace(/\t/g, " ").split(pattern).filter(Boolean);
    let trailingWs: string | undefined;
    for (const line of lineArray) {
        if (!/^\s+$/.test(line)) {
            if (trailingWs) {
                nodes.push(LineBreak.fromData({ break: "line" }));
                trailingWs = undefined;
            }
            nodes.push(TextRun.fromData(TextRun.normalizeText(line)));
        } else if (trailingWs) {
            nodes.push(ParagraphBreak.fromData({ break: "para" }));
            trailingWs = undefined;
        } else {
            trailingWs = line;
        }
    }
    if (trailingWs && nodes.length === 0) {
        nodes.push(TextRun.fromData(TextRun.normalizeText(trailingWs)));
    }
    return FlowContent.fromData(nodes);
}
