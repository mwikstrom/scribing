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
import { FlowTheme } from "./FlowTheme";
import { InlineNode } from "./InlineNode";
import { FlowOperationRegistry } from "./internal/class-registry";
import { invertFormatOp } from "./internal/format-helpers";
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

/**
 * The base record class for {@link FormatText}
 * @public
 */
export const FormatTextBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of format text operations
 * @public
 */
export interface FormatTextProps {
    /** The range that shall be formatted */
    range: FlowRange;

    /** The style to apply */
    style: TextStyle;
}

/**
 * Data of format text operations
 * @public
 */
export interface FormatTextData extends FormatTextProps {
    /** Data classifier */
    format: "text",
}

/**
 * Represents an operation that applies a text style to a range of flow content.
 * @sealed
 * @public
 */
@frozen
@validating
@FlowOperationRegistry.register
export class FormatText extends FormatTextBase implements Readonly<FormatTextProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FormatText);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FormatTextData): FormatText {
        const { range, style } = data;
        const props: FormatTextProps = { range, style };
        return new FormatText(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { range, style } = this;
        return invertFormatOp<TextStyle, TextStyleProps>({
            content,
            range,
            style,
            getStyle: node => node instanceof InlineNode ? node.style : null,
            makeStyle: props => new TextStyle(props),
            makeFormatOp: props => new FormatText(props),
            makeUnformatOp: props => new UnformatText(props),
        });
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof FormatText && this.range.equals(next.range)) {
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
        return content.formatText(this.range, this.style, theme);
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
