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
import { FormatBox } from "./FormatBox";
import { FlowOperationRegistry } from "../internal/class-registry";
import { invertUnformatOp } from "../internal/format-helpers";
import { 
    transformEdgeInflatingRangeOpAfterInsertFlow, 
    transformRangeOpAfterRemoveFlow
} from "../internal/transform-helpers";
import { BoxStyle, BoxStyleProps } from "../styles/BoxStyle";
import { FlowBox } from "../nodes/FlowBox";

const Props = {
    range: FlowRange.classType,
    style: BoxStyle.classType,
};

const Data = {
    unformat: constType("box"),
    range: Props.range,
    style: BoxStyle.classType,
};

const PropsType: RecordType<UnformatBoxProps> = recordType(Props);
const DataType: RecordType<UnformatBoxData> = recordType(Data);
const propsToData = ({range, style}: UnformatBoxProps): UnformatBoxData => ({ 
    unformat: "box", 
    range, 
    style 
});

/**
 * The base record class for {@link UnformatBox}
 * @public
 */
export const UnformatBoxBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of unformat box operations
 * @public
 */
export interface UnformatBoxProps {
    /** The range that shall be unformatted */
    range: FlowRange;

    /** The style to unformat */
    style: BoxStyle;
}

/**
 * Data of unformat box operations
 * @public
 */
export interface UnformatBoxData extends UnformatBoxProps {
    /** Data classifier */
    unformat: "box",
}

/**
 * Represents an operation that unapplies a box style to a range of flow content.
 * @sealed
 * @public
 */
@frozen
@validating
@FlowOperationRegistry.register
export class UnformatBox extends UnformatBoxBase implements Readonly<UnformatBoxProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => UnformatBox);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: UnformatBoxData): UnformatBox {
        const { range, style } = data;
        const props: UnformatBoxProps = { range, style };
        return new UnformatBox(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { range, style } = this;
        return invertUnformatOp<BoxStyle, BoxStyleProps>({
            content,
            range,
            style,
            getStyle: node => node instanceof FlowBox ? node.style : null,
            makeStyle: props => new BoxStyle(props),
            makeFormatOp: props => new FormatBox(props),
        });
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof UnformatBox && this.range.equals(next.range)) {
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
    applyToContent(content: FlowContent): FlowContent {
        return content.unformatBox(this.range, this.style);
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
