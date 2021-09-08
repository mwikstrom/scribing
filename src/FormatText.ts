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
import { TextStyle, TextStyleProps } from "./TextStyle";
import { UnformatText } from "./UnformatText";

const Props = {
    range: FlowRange.classType,
    style: TextStyle.classType,
};

const Data = {
    format: constType("text"),
    range: Props.range,
    style: TextStyle.classType,
};

const PropsType: RecordType<FormatTextProps> = recordType(Props);
const DataType: RecordType<FormatTextData> = recordType(Data);
const propsToData = ({range, style}: FormatTextProps): FormatTextData => ({ format: "text", range, style });
const BASE = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of format text operations
 * @public
 */
export interface FormatTextProps {
    range: FlowRange;
    style: TextStyle;
}

/**
 * Data of format text operations
 * @public
 */
export interface FormatTextData {
    format: "text",
    range: FlowRange;
    style: TextStyle;
}

/**
 * Represents an operation that applies a text style to a range of flow content.
 * @sealed
 * @public
 */
@frozen
@validating
@registerOperation
export class FormatText extends BASE implements Readonly<FormatTextProps> {
    public static readonly classType = recordClassType(() => FormatText);

    public static fromData(@type(DataType) data: FormatTextData): FormatText {
        const { range, style } = data;
        const props: FormatTextProps = { range, style };
        return new FormatText(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(state: FlowContent): FlowOperation | null {
        const { range, style } = this;
        return invertFormatOp<TextStyle, TextStyleProps>({
            state,
            range,
            style,
            getStyle: node => node.getTextStyle(),
            makeStyle: props => new TextStyle(props),
            makeFormatOp: props => new FormatText(props),
            makeUnformatOp: props => new UnformatText(props),
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
        return container.formatText(this.range, this.style);
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
