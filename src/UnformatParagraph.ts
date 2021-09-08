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
import { FormatParagraph } from "./FormatParagraph";
import { invertUnformatOp } from "./internal/format-helpers";
import { registerOperation } from "./internal/operation-registry";
import { 
    transformEdgeInflatingRangeOpAfterInsertion, 
    transformRangeOpAfterRemoval
} from "./internal/transform-helpers";
import { ParagraphStyle, ParagraphStyleProps } from "./ParagraphStyle";

const Props = {
    range: FlowRange.classType,
    style: ParagraphStyle.classType,
};

const Data = {
    unformat: constType("para"),
    range: Props.range,
    style: ParagraphStyle.classType,
};

const PropsType: RecordType<UnformatParagraphProps> = recordType(Props);
const DataType: RecordType<UnformatParagraphData> = recordType(Data);
const propsToData = ({range, style}: UnformatParagraphProps): UnformatParagraphData => ({ 
    unformat: "para", 
    range, 
    style 
});
const BASE = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of unformat paragraph operations
 * @public
 */
export interface UnformatParagraphProps {
    range: FlowRange;
    style: ParagraphStyle;
}

/**
 * Data of unformat paragraph operations
 * @public
 */
export interface UnformatParagraphData {
    unformat: "para",
    range: FlowRange;
    style: ParagraphStyle;
}

/**
 * Represents an operation that unapplies a paragraph style to a range of flow content.
 * @sealed
 * @public
 */
@frozen
@validating
@registerOperation
export class UnformatParagraph extends BASE implements Readonly<UnformatParagraphProps> {
    public static readonly classType = recordClassType(() => UnformatParagraph);

    public static fromData(@type(DataType) data: UnformatParagraphData): UnformatParagraph {
        const { range, style } = data;
        const props: UnformatParagraphProps = { range, style };
        return new UnformatParagraph(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(state: FlowContent): FlowOperation | null {
        const { range, style } = this;
        return invertUnformatOp<ParagraphStyle, ParagraphStyleProps>({
            state,
            range,
            style,
            getStyle: node => node.getParagraphStyle(),
            makeStyle: props => new ParagraphStyle(props),
            makeFormatOp: props => new FormatParagraph(props),
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
        return container.unformatParagraph(this.range, this.style);
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
