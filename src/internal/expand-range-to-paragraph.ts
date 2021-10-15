import { FlowContent } from "../FlowContent";
import { FlowRange } from "../FlowRange";
import { InsertContent } from "../InsertContent";
import { ParagraphBreak } from "../ParagraphBreak";
import { ParagraphStyle } from "../ParagraphStyle";

/** @internal */
export function expandRangeToParagraph(
    range: FlowRange,
    content: FlowContent,
): FlowRange;

/** @internal */
export function expandRangeToParagraph(
    range: FlowRange,
    content: FlowContent,
    insertStyle: ParagraphStyle | null,
): FlowRange | InsertContent;

/** @internal */
export function expandRangeToParagraph(
    range: FlowRange,
    content: FlowContent,
    insertStyle: ParagraphStyle | null = null,
): FlowRange | InsertContent {
    // Check if the specified range ends with a paragraph break
    let endsWithBreak = range.size > 0 && content.peek(range.last - 1).node instanceof ParagraphBreak;

    // If it doesn't end with a paragraph break, then we'll try to expand the range
    // to include the closest following paragraph break.
    let delta = 0;
    for (const node of content.peek(range.last).after) {
        delta += node.size;
        if (node instanceof ParagraphBreak) {
            endsWithBreak = true;
            break;
        }
    }

    if (endsWithBreak) {
        // We found a break. Inflate range.
        return range.inflate(delta);
    }

    // We didn't find a break, so this is a trailing paragraph.
    // To format it we need to append a styled paragraph break!

    if (!insertStyle) {
        return range;
    }

    return new InsertContent({
        position: range.last + delta,
        content: FlowContent.fromData([
            new ParagraphBreak({ style: insertStyle }),
        ]),
    });
}
