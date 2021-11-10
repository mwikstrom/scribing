import { FlowBatch, FormatParagraph, ParagraphStyle, ParagraphStyleProps, UnformatParagraph } from "..";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { splitRangeByUniformParagraphStyle } from "./split-range-by-paragraph-style";
import { mapNotNull } from "./utils";

/** @internal */
export const formatListLevel = (
    range: FlowRange,
    content: FlowContent,
    current: number,
    target: number,
): FlowOperation | null => {
    if (range.isCollapsed || current === target) {
        return null;
    }

    let formatStyle = ParagraphStyle.empty.set("listLevel", target);

    // When going from list level zero we'll hide the marker initially
    if (current === 0) {
        formatStyle = formatStyle.set("hideListMarker", true);
    }

    const formatOp = new FormatParagraph({
        range,
        style: formatStyle,
    });

    if (target > 0) {
        return formatOp;
    }

    // When setting list level zero we should also unformat styles that
    // only make sense in a list
    const unformatKeys: (keyof ParagraphStyleProps)[] = [
        "hideListMarker",
        "listCounter",
        "listCounterPrefix",
        "listCounterSuffix",
        "listMarker",
    ];

    const unformatOps = mapNotNull(
        splitRangeByUniformParagraphStyle(range, content, ...unformatKeys),
        ([subrange, props]) => {
            const unformatStyle = ParagraphStyle.empty.merge(props);
            if (unformatStyle.isEmpty || subrange.isCollapsed) {
                return null;
            } else {
                return new UnformatParagraph({
                    range: subrange,
                    style: unformatStyle,
                });
            }
        },
    );

    return FlowBatch.fromArray([
        formatOp,
        ...unformatOps,
    ]);
};
