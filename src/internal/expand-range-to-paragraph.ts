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
    insertStyle: ParagraphStyle,
): FlowRange | InsertContent;

/** @internal */
export function expandRangeToParagraph(
    range: FlowRange,
    content: FlowContent,
    insertStyle?: ParagraphStyle,
): FlowRange | InsertContent {
    let foundBreak = false;

    // Check if there's a paragraph break in the selected range
    if (range.size > 0) {
        for (const node of content.peek(range.first).range(range.size)) {
            if (node instanceof ParagraphBreak) {
                foundBreak = true;
                break;
            }
        }
    }

    if (foundBreak) {
        return range;
    }

    // If we didn't find a paragraph break, then we'll try to expand the range
    // to include the closest following paragraph break.
    let delta = 0;
    for (const node of content.peek(range.last).after) {
        delta += node.size;
        if (node instanceof ParagraphBreak) {
            foundBreak = true;
            break;
        }
    }

    if (foundBreak) {
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
