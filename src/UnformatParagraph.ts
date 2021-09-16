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
import { FormatParagraph } from "./FormatParagraph";
import { FlowOperationRegistry } from "./internal/class-registry";
import { invertUnformatOp } from "./internal/format-helpers";
import { 
    transformEdgeInflatingRangeOpAfterInsertion, 
    transformRangeOpAfterRemoval
} from "./internal/transform-helpers";
import { ParagraphBreak } from "./ParagraphBreak";
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

/**
 * The base record class for {@link UnformatParagraph}
 * @public
 */
export const UnformatParagraphBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of unformat paragraph operations
 * @public
 */
export interface UnformatParagraphProps {
    /** The range that shall be unformatted */
    range: FlowRange;

    /** The style to unformat */
    style: ParagraphStyle;
}

/**
 * Data of unformat paragraph operations
 * @public
 */
export interface UnformatParagraphData extends UnformatParagraphProps {
    /** Data classifier */
    unformat: "para",
}

/**
 * Represents an operation that unapplies a paragraph style to a range of flow content.
 * @sealed
 * @public
 */
@frozen
@validating
@FlowOperationRegistry.register
export class UnformatParagraph extends UnformatParagraphBase implements Readonly<UnformatParagraphProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => UnformatParagraph);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: UnformatParagraphData): UnformatParagraph {
        const { range, style } = data;
        const props: UnformatParagraphProps = { range, style };
        return new UnformatParagraph(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { range, style } = this;
        return invertUnformatOp<ParagraphStyle, ParagraphStyleProps>({
            content,
            range,
            style,
            getStyle: node => node instanceof ParagraphBreak ? node.style : null,
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
     * {@inheritDoc FlowOperation.applyToContent}
     * @override
     */
    applyToContent(content: FlowContent): FlowContent {
        return content.unformatParagraph(this.range, this.style);
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
