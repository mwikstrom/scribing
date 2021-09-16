import { 
    constType,
    frozen, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating
} from "paratype";

import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection } from "./FlowSelection";
import { invertFormatOp } from "./internal/format-helpers";
import { registerOperation } from "./internal/operation-registry";
import { 
    transformEdgeInflatingRangeOpAfterInsertion, 
    transformRangeOpAfterRemoval
} from "./internal/transform-helpers";
import { ParagraphStyle, ParagraphStyleProps } from "./ParagraphStyle";
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
    range: FlowRange;
    style: ParagraphStyle;
}

/**
 * Data of format paragraph operations
 * @public
 */
export interface FormatParagraphData {
    format: "para",
    range: FlowRange;
    style: ParagraphStyle;
}

/**
 * Represents an operation that applies a paragraph style to a range of flow content.
 * @sealed
 * @public
 */
@frozen
@validating
@registerOperation
export class FormatParagraph extends FormatParagraphBase implements Readonly<FormatParagraphProps> {
    public static readonly classType = recordClassType(() => FormatParagraph);

    public static fromData(@type(DataType) data: FormatParagraphData): FormatParagraph {
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
            getStyle: node => node.getParagraphStyle(),
            makeStyle: props => new ParagraphStyle(props),
            makeFormatOp: props => new FormatParagraph(props),
            makeUnformatOp: props => new UnformatParagraph(props),
        });
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
    applyToContent(content: FlowContent): FlowContent {
        return content.formatParagraph(this.range, this.style);
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
     * {@inheritDoc FlowOperation.afterInsertion}
     */
    afterInsertion(other: FlowRange): FlowOperation | null {
        return transformEdgeInflatingRangeOpAfterInsertion(this, other);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoval}
     */
    afterRemoval(other: FlowRange): FlowOperation | null {
        return transformRangeOpAfterRemoval(this, other);
    }
}
