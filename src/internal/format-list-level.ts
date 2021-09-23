import { FlowBatch, FormatParagraph, ParagraphStyle, ParagraphStyleProps, UnformatParagraph } from "..";
import { FlowContent } from "../FlowContent";
import { FlowOperation } from "../FlowOperation";
import { FlowRange } from "../FlowRange";
import { splitRangeByUniformParagraphStyle } from "./split-range-by-paragraph-style";
import { mapNotNull } from "./utils";

/** @internal */
export const formatListLevel = (
    range: FlowRange,
    content: FlowContent,
    level: number,
): FlowOperation | null => {
    if (range.isCollapsed) {
        return null;
    }

    const formatOp = new FormatParagraph({
        range,
        style: ParagraphStyle.empty.set("listLevel", level),
    });

    if (level > 0) {
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
            const style = ParagraphStyle.empty.merge(props);
            if (style.isEmpty || subrange.isCollapsed) {
                return null;
            } else {
                return new UnformatParagraph({
                    range: subrange,
                    style,
                });
            }
        },
    );

    return FlowBatch.fromArray([
        formatOp,
        ...unformatOps,
    ]);
};
