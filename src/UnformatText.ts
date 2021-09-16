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
import { FormatText } from "./FormatText";
import { invertUnformatOp } from "./internal/format-helpers";
import { registerOperation } from "./internal/operation-registry";
import { 
    transformEdgeInflatingRangeOpAfterInsertion, 
    transformRangeOpAfterRemoval
} from "./internal/transform-helpers";
import { TextStyle, TextStyleProps } from "./TextStyle";

const Props = {
    range: FlowRange.classType,
    style: TextStyle.classType,
};

const Data = {
    unformat: constType("text"),
    range: Props.range,
    style: TextStyle.classType,
};

const PropsType: RecordType<UnformatTextProps> = recordType(Props);
const DataType: RecordType<UnformatTextData> = recordType(Data);
const propsToData = ({range, style}: UnformatTextProps): UnformatTextData => ({ unformat: "text", range, style });

/**
 * The base record class for {@link UnformatText}
 * @public
 */
export const UnformatTextBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of unformat text operations
 * @public
 */
export interface UnformatTextProps {
    /** The range that shall be unformatted */
    range: FlowRange;

    /** The style to unformat */
    style: TextStyle;
}

/**
 * Data of unformat text operations
 * @public
 */
export interface UnformatTextData extends UnformatTextProps {
    /** Data classifier */
    unformat: "text",
}

/**
 * Represents an operation that unapplies a text style to a range of flow content.
 * @sealed
 * @public
 */
@frozen
@validating
@registerOperation
export class UnformatText extends UnformatTextBase implements Readonly<UnformatTextProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => UnformatText);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: UnformatTextData): UnformatText {
        const { range, style } = data;
        const props: UnformatTextProps = { range, style };
        return new UnformatText(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { range, style } = this;
        return invertUnformatOp<TextStyle, TextStyleProps>({
            content,
            range,
            style,
            getStyle: node => node.getTextStyle(),
            makeStyle: props => new TextStyle(props),
            makeFormatOp: props => new FormatText(props),
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
        return content.unformatText(this.range, this.style);
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
