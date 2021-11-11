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
import { BoxStyle, BoxStyleProps } from "../styles/BoxStyle";
import { UnformatBox } from "./UnformatBox";
import { FlowBox } from "../nodes/FlowBox";

const Props = {
    range: FlowRange.classType,
    style: BoxStyle.classType,
};

const Data = {
    format: constType("box"),
    range: Props.range,
    style: BoxStyle.classType,
};

const PropsType: RecordType<FormatBoxProps> = recordType(Props);
const DataType: RecordType<FormatBoxData> = recordType(Data);
const propsToData = ({range, style}: FormatBoxProps): FormatBoxData => ({ format: "box", range, style });

/**
 * The base record class for {@link FormatBox}
 * @public
 */
export const FormatBoxBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of format box operations
 * @public
 */
export interface FormatBoxProps {
    /** The range that shall be formatted */
    range: FlowRange;

    /** The style to apply */
    style: BoxStyle;
}

/**
 * Data of format box operations
 * @public
 */
export interface FormatBoxData extends FormatBoxProps {
    /** Data classifier */
    format: "box",
}

/**
 * Represents an operation that applies a box style to a range of flow content.
 * @sealed
 * @public
 */
@frozen
@validating
@FlowOperationRegistry.register
export class FormatBox extends FormatBoxBase implements Readonly<FormatBoxProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FormatBox);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FormatBoxData): FormatBox {
        const { range, style } = data;
        const props: FormatBoxProps = { range, style };
        return new FormatBox(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { range, style } = this;
        return invertFormatOp<BoxStyle, BoxStyleProps>({
            content,
            range,
            style,
            getStyle: node => node instanceof FlowBox ? node.style : null,
            makeStyle: props => new BoxStyle(props),
            makeFormatOp: props => new FormatBox(props),
            makeUnformatOp: props => new UnformatBox(props),
        });
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof FormatBox && this.range.equals(next.range)) {
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
        return content.formatBox(this.range, this.style, theme);
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
