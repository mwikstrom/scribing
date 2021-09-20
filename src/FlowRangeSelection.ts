import { frozen, lazyType, RecordClass, recordClassType, recordType, RecordType, type, validating } from "paratype";
import { FlowBatch } from "./FlowBatch";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection, RemoveFlowSelectionOptions } from "./FlowSelection";
import { FlowTheme } from "./FlowTheme";
import { FormatParagraph } from "./FormatParagraph";
import { FormatText } from "./FormatText";
import { InsertContent } from "./InsertContent";
import { FlowSelectionRegistry } from "./internal/class-registry";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "./internal/transform-helpers";
import { ParagraphBreak } from "./ParagraphBreak";
import { ParagraphStyle, ParagraphStyleProps } from "./ParagraphStyle";
import { RemoveRange } from "./RemoveRange";
import { TextStyle, TextStyleProps } from "./TextStyle";
import { UnformatParagraph } from "./UnformatParagraph";
import { UnformatText } from "./UnformatText";

const Props = {
    range: lazyType(() => FlowRange.classType),
};

const PropsType: RecordType<FlowRangeSelectionProps> = recordType(Props);

/**
 * The base record class for {@link FlowRangeSelection}
 * @public
 */
export const FlowRangeSelectionBase = RecordClass(PropsType, FlowSelection);

/**
 * Properties of flow range selections
 * @public
 */
export interface FlowRangeSelectionProps {
    /** The selected range */
    range: FlowRange;
}

/**
 * Represents a range of selected flow content
 * @public
 * @sealed
 */
@frozen
@validating
@FlowSelectionRegistry.register
export class FlowRangeSelection extends FlowRangeSelectionBase implements Readonly<FlowRangeSelectionProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowRangeSelection);

    /**
     * {@inheritDoc FlowSelection.isCollapsed}
     * @override
     */
    public get isCollapsed(): boolean {
        return this.range.isCollapsed;
    }

    /**
     * {@inheritDoc FlowSelection.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof ParagraphStyleProps>,
    ): ParagraphStyle {
        const { first, size } = this.range;
        const cursor = content.peek(first);
        let paraStyle = cursor.getParagraphStyle() ?? ParagraphStyle.empty;
        let paraTheme = theme?.getParagraphTheme(paraStyle?.variant ?? "normal");

        if (size === 0) {
            const ambient = paraTheme?.getAmbientParagraphStyle() ?? ParagraphStyle.empty;
            return ambient.isEmpty ? paraStyle : ambient.merge(paraStyle);
        }

        if (!diff) {
            diff = new Set();
        }

        let result = ParagraphStyle.empty;
        for (const node of cursor.range(size)) {
            if (node instanceof ParagraphBreak) {
                paraStyle = cursor.getParagraphStyle() ?? ParagraphStyle.empty;
                paraTheme = theme?.getParagraphTheme(paraStyle?.variant ?? "normal");
            }
            const style = node.getUniformParagraphStyle(paraTheme, diff);
            if (style) {
                result = result.merge(style, diff);
            }
        }

        return result;
    }

    /**
     * {@inheritDoc FlowSelection.getUniformTextStyle}
     * @override
     */
    public getUniformTextStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof TextStyleProps>,
    ): TextStyle {
        const { first, size } = this.range;
        const cursor = content.peek(first);
        let variant = cursor.getParagraphStyle()?.variant ?? "normal";
        let paraTheme = theme?.getParagraphTheme(variant);
        
        if (size === 0) {            
            const ambient = paraTheme?.getAmbientTextStyle() ?? TextStyle.empty;
            const style = cursor.getTextStyle() ?? TextStyle.empty;
            return ambient.isEmpty ? style : ambient.merge(style);
        }

        if (!diff) {
            diff = new Set();
        }

        let result = TextStyle.empty;
        for (const node of cursor.range(size)) {
            if (node instanceof ParagraphBreak) {
                variant = node.style.variant ?? "normal";
                paraTheme = theme?.getParagraphTheme(variant);
            } else {
                const style = node.getUniformTextStyle(paraTheme, diff);
                if (style) {
                    result = result.merge(style, diff);
                }
            }
        }

        return result;
    }
 
    /**
     * {@inheritDoc FlowSelection.formatParagraph}
     * @override
     */
    public formatParagraph(@type(ParagraphStyle.classType) style: ParagraphStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new FormatParagraph({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.formatText}
     * @override
     */
    public formatText(@type(TextStyle.classType) style: TextStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new FormatText({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.insert}
     * @override
     */
    public insert(@type(FlowContent.classType) content: FlowContent): FlowOperation | null {
        const { range } = this;
        const { first: position } = range;
        if (this.range.isCollapsed) {
            return new InsertContent({ position, content });
        } else {
            return FlowBatch.fromArray([
                new RemoveRange({ range }),
                new InsertContent({ position, content }),
            ]);
        }
    }

    /**
     * {@inheritDoc FlowSelection.remove}
     * @override
     */
    public remove(options: RemoveFlowSelectionOptions = {}): FlowOperation | null {
        const { whenCollapsed, content } = options;
        let { range } = this;

        if (range.isCollapsed) {
            if (whenCollapsed === "removeBackward" && range.first > 0) {
                range = FlowRange.at(range.first, -1);
            } else if (whenCollapsed === "removeForward" && content && range.last < content.size - 1) {
                range = FlowRange.at(range.last, 1);
            } else {
                return null;
            }
        }
        
        return new RemoveRange({ range });
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatParagraph(@type(ParagraphStyle.classType) style: ParagraphStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new UnformatParagraph({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.unformatText}
     * @override
     */
    public unformatText(@type(TextStyle.classType) style: TextStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new UnformatText({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertion}
     * @override
     */
    afterInsertion(range: FlowRange, mine: boolean): FlowSelection | null {
        // Translate when insertion is mine and occurs at the current carent (collapsed selection)
        if (mine && this.range.isCollapsed && this.range.focus === range.first) {
            return this.set("range", FlowRange.at(range.last));
        }

        const updated = transformRangeAfterInsertion(this.range, range);
        return this.set("range", updated);
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertion}
     * @override
     */
    afterRemoval(range: FlowRange, mine: boolean): FlowSelection | null {
        const updated = transformRangeAfterRemoval(this.range, range, mine);
        if (updated === null) {
            return null;
        } else {
            return this.set("range", updated);
        }
    }
}
