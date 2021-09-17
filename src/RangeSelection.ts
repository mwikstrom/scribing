import { frozen, lazyType, RecordClass, recordClassType, recordType, RecordType, type, validating } from "paratype";
import { FlowBatch } from "./FlowBatch";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection } from "./FlowSelection";
import { FormatParagraph } from "./FormatParagraph";
import { FormatText } from "./FormatText";
import { InsertContent } from "./InsertContent";
import { FlowSelectionRegistry } from "./internal/class-registry";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "./internal/transform-helpers";
import { ParagraphStyle } from "./ParagraphStyle";
import { RemoveRange } from "./RemoveRange";
import { TextStyle } from "./TextStyle";
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
     * {@inheritDoc FlowSelection.formatParagraph}
     * @override
     */
    public formatParagraph(@type(ParagraphStyle.classType) style: ParagraphStyle): FlowOperation | null {
        const { range } = this;
        return new FormatParagraph({ range, style });
    }

    /**
     * {@inheritDoc FlowSelection.formatText}
     * @override
     */
    public formatText(@type(TextStyle.classType) style: TextStyle): FlowOperation | null {
        const { range } = this;
        return new FormatText({ range, style });
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
        return new RemoveRange({ range });
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatParagraph(@type(ParagraphStyle.classType) style: ParagraphStyle): FlowOperation | null {
        const { range } = this;
        return new UnformatParagraph({ range, style });
    }

    /**
     * {@inheritDoc FlowSelection.unformatText}
     * @override
     */
    public unformatText(@type(TextStyle.classType) style: TextStyle): FlowOperation | null {
        const { range } = this;
        return new UnformatText({ range, style });
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
