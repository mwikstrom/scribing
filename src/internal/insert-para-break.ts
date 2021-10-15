import { FlowBatch } from "../FlowBatch";
import { FlowContent } from "../FlowContent";
import { FlowOperation } from "../FlowOperation";
import { FlowRange } from "../FlowRange";
import { FlowTheme } from "../FlowTheme";
import { FormatParagraph } from "../FormatParagraph";
import { InsertContent } from "../InsertContent";
import { ParagraphBreak } from "../ParagraphBreak";
import { ParagraphStyle } from "../ParagraphStyle";
import { UnformatParagraph } from "../UnformatParagraph";
import { formatListLevel } from "./format-list-level";

/** @internal */
export const insertParaBreak = (
    insertOp: InsertContent,
    target?: FlowContent,
    theme?: FlowTheme,
): FlowOperation | null => {
    const { position, content } = insertOp;

    if (!target) {
        return insertOp;
    }

    const batch: FlowOperation[] = [insertOp];
    const splitParaCursor = target.peek(position).findNodeForward(n => n instanceof ParagraphBreak);

    // Not splitting a pargraph?
    if (!splitParaCursor) {
        return insertOp;
    }

    const splitPara = splitParaCursor.node as ParagraphBreak;
    const splitParaListCounter = splitPara.style.get("listCounter");

    // If the para that is being split is resetting its counter, then the intention is
    // to move the counter reset from that para break to the newly inserted break.
    // We must therefore clear it on split para break (it will be copied automatically)
    if (splitParaListCounter) {
        batch.push(new UnformatParagraph({
            range: FlowRange.at(splitParaCursor.position + content.size, 1),
            style: ParagraphStyle.empty.set("listCounter", splitParaListCounter),
        }));
    }

    // Are we at the end of a paragraph?
    if (splitParaCursor.position === position) {
        // The intention is to insert a break so that the next pargraph uses the
        // next variant (as defined by the theme)
        if (splitPara.style.variant && splitPara.style.variant !== "normal" && theme) {
            const nextVariant = theme.getParagraphTheme(splitPara.style.variant).getNextVariant();
            if (splitPara.style.variant !== nextVariant) {
                batch.push(new FormatParagraph({
                    range: FlowRange.at(splitParaCursor.position + content.size, splitPara.size),
                    style: ParagraphStyle.empty.set("variant", nextVariant),
                }));
            }
        }

        // Are we at the start of a paragraph (start of flow or after para break)?
        if (position === 0 || target.peek(position - 1).node instanceof ParagraphBreak) {
            // When inserting a para break between two paragraphs, the user is pressing ENTER
            // in an empty paragraph, then the intention is to reformat the current paragraph
            // to the next variant (unless it already is of the next variant)
            if (splitPara.style.variant && splitPara.style.variant !== "normal" && theme) {
                const nextVariant = theme.getParagraphTheme(splitPara.style.variant).getNextVariant();
                if (splitPara.style.variant !== nextVariant) {
                    return new FormatParagraph({
                        range: FlowRange.at(splitParaCursor.position, splitPara.size),
                        style: ParagraphStyle.empty.set("variant", nextVariant),
                    });
                }
            }

            // Are we inside a list?
            const { listLevel = 0} = splitPara.style;
            if (listLevel > 0) {
                // If the current list marker is hidden, then we'll show it
                const { hideListMarker } = splitPara.style;
                if (hideListMarker) {
                    return new UnformatParagraph({
                        range: FlowRange.at(splitParaCursor.position, splitPara.size),
                        style: ParagraphStyle.empty.set("hideListMarker", hideListMarker),
                    });
                }

                // Otherwise we'll decrement the current list level
                return formatListLevel(
                    FlowRange.at(splitParaCursor.position, splitPara.size),
                    target,
                    listLevel,
                    listLevel - 1,
                );
            }
        }
    }

    return FlowBatch.fromArray(batch);
};
