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
const BASE = RecordClass(PropsType, FlowOperation, DataType, propsToData);

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
export class FormatParagraph extends BASE implements Readonly<FormatParagraphProps> {
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
    invert(state: FlowContent): FlowOperation | null {
        const { range, style } = this;
        return invertFormatOp<ParagraphStyle, ParagraphStyleProps>({
            state,
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
     * {@inheritDoc FlowOperation.applyTo}
     * @override
     */
    applyTo(container: FlowContent): FlowContent {
        return container.formatParagraph(this.range, this.style);
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
