import { 
    constType,
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
} from "paratype";

import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowOperationRegistry } from "../internal/class-registry";
import { invertFormatOp } from "../internal/format-helpers";
import { 
    transformEdgeInflatingRangeOpAfterInsertFlow, 
    transformRangeOpAfterRemoveFlow
} from "../internal/transform-helpers";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { ParagraphStyle, ParagraphStyleProps } from "../styles/ParagraphStyle";
import { UnformatParagraph } from "./UnformatParagraph";

const Props = {
    range: FlowRange.classType,
    style: ParagraphStyle.classType,
};

const Data = {
    format: constType("para"),
    range: Props.range,
    style: ParagraphStyle.classType,
};

const PropsType: RecordType<FormatParagraphProps> = recordType(Props);
const DataType: RecordType<FormatParagraphData> = recordType(Data);
const propsToData = ({range, style}: FormatParagraphProps): FormatParagraphData => ({ format: "para", range, style });

/**
 * The base record class for {@link FormatParagraph}
 * @public
 */
export const FormatParagraphBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of format paragraph operations
 * @public
 */
export interface FormatParagraphProps {
    /** The range that shall be formatted */
    range: FlowRange;

    /** The style to apply */
    style: ParagraphStyle;
}

/**
 * Data of format paragraph operations
 * @public
 */
export interface FormatParagraphData extends FormatParagraphProps {
    /** Data classifier */
    format: "para",
}

/**
 * Represents an operation that applies a paragraph style to a range of flow content.
 * @sealed
 * @public
 */
@FlowOperationRegistry.register
export class FormatParagraph extends FormatParagraphBase implements Readonly<FormatParagraphProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FormatParagraph);

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: FormatParagraphData): FormatParagraph {
        const { range, style } = data;
        const props: FormatParagraphProps = { range, style };
        return new FormatParagraph(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { range, style } = this;
        return invertFormatOp<ParagraphStyle, ParagraphStyleProps>({
            content,
            range,
            style,
            getStyle: node => node instanceof ParagraphBreak ? node.style : null,
            makeStyle: props => new ParagraphStyle(props),
            makeFormatOp: props => new FormatParagraph(props),
            makeUnformatOp: props => new UnformatParagraph(props),
        });
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof FormatParagraph && this.range.equals(next.range)) {
            return this.set("style", this.style.merge(next.style));
        } else {
            return null;
        }
    }

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(other: FlowOperation): FlowOperation | null {
        // Formatting does not affect other operation
        return other;
    }

    /**
     * {@inheritDoc FlowOperation.applyToContent}
     * @override
     */
    applyToContent(content: FlowContent, theme?: FlowTheme): FlowContent {
        return content.formatParagraph(this.range, this.style, theme);
    }

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(selection: FlowSelection): FlowSelection {
        // Formatting does not affect selection
        return selection;
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertFlow}
     */
    afterInsertFlow(other: FlowRange): FlowOperation | null {
        return transformEdgeInflatingRangeOpAfterInsertFlow(this, other);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoveFlow}
     */
    afterRemoveFlow(other: FlowRange): FlowOperation | null {
        return transformRangeOpAfterRemoveFlow(this, other);
    }
}
