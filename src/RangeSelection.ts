import { frozen, lazyType, RecordClass, recordClassType, recordType, RecordType, type, validating } from "paratype";
import { FlowBatch } from "./FlowBatch";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection } from "./FlowSelection";
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

const PropsType: RecordType<RangeSelectionProps> = recordType(Props);

/**
 * The base record class for {@link RangeSelection}
 * @public
 */
export const RangeSelectionBase = RecordClass(PropsType, FlowSelection);

/**
 * Properties of range selections
 * @public
 */
export interface RangeSelectionProps {
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
export class RangeSelection extends RangeSelectionBase implements Readonly<RangeSelectionProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => RangeSelection);

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

        if (size === 0) {
            const style = cursor.getParagraphStyle() ?? ParagraphStyle.empty;
            theme = theme?.getParagraphTheme(style.variant ?? "normal");
            const ambient = theme?.getAmbientParagraphStyle() ?? ParagraphStyle.empty;
            return ambient.isEmpty ? style : ambient.merge(style);
        }

        if (!diff) {
            diff = new Set();
        }

        let result = ParagraphStyle.empty;
        for (const node of cursor.range(size)) {
            const style = node.getUniformParagraphStyle(theme, diff);
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
            const style = node.getUniformTextStyle(paraTheme, diff);
            if (style) {
                result = result.merge(style, diff);
            }

            if (node instanceof ParagraphBreak) {
                variant = node.style.variant ?? "normal";
                paraTheme = theme?.getParagraphTheme(variant);
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
    public remove(): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new RemoveRange({ range });
        }
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
