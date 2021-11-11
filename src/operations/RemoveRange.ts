import { 
    frozen, 
    lazyType, 
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
import { InsertContent } from "./InsertContent";
import { FlowOperationRegistry } from "../internal/class-registry";
import {  transformRangeOpAfterInsertFlow, transformRangeOpAfterRemoveFlow } from "../internal/transform-helpers";

const Props = {
    range: lazyType(() => FlowRange.classType),
};

const Data = {
    remove: Props.range,
};

const PropsType: RecordType<RemoveRangeProps> = recordType(Props);
const DataType: RecordType<RemoveRangeData> = recordType(Data);
const propsToData = ({range}: RemoveRangeProps): RemoveRangeData => ({ remove: range });

/**
 * The base record class for {@link RemoveRange}
 * @public
 */
export const RemoveRangeBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of remove range opertions
 * @public
 */
export interface RemoveRangeProps {
    /** The range that shall be removed */
    range: FlowRange;
}

/**
 * Data of remove range operations
 * @public
 */
export interface RemoveRangeData {
    /** {@inheritdoc RemoveRangeProps.range} */
    remove: FlowRange;
}

/**
 * Represents an operation that removes a range of flow.
 * @sealed
 * @public
 */
@frozen
@validating
@FlowOperationRegistry.register
export class RemoveRange extends RemoveRangeBase implements Readonly<RemoveRangeProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => RemoveRange);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: RemoveRangeData): RemoveRange {
        const { remove: range } = data;
        const props: RemoveRangeProps = { range };
        return new RemoveRange(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): InsertContent {
        return new InsertContent({ position: this.range.first, content: content.copy(this.range) });
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (
            next instanceof RemoveRange &&
            this.range.isBackward === next.range.isBackward &&
            this.range.first === next.range.anchor
        ) {
            return this.set("range", next.range.inflate(this.range.size));
        } else {
            return null;
        }
    }

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(other: FlowOperation): FlowOperation | null {
        return other.afterRemoveFlow(this.range);
    }

    /**
     * {@inheritDoc FlowOperation.applyToContent}
     * @override
     */
    applyToContent(content: FlowContent): FlowContent {
        return content.remove(this.range);
    }

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(selection: FlowSelection, mine: boolean): FlowSelection | null {
        return selection.afterRemoveFlow(this.range, mine);
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertFlow}
     */
    afterInsertFlow(other: FlowRange): FlowOperation | null {
        return transformRangeOpAfterInsertFlow(this, other);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoveFlow}
     */
    afterRemoveFlow(other: FlowRange): FlowOperation | null {
        return transformRangeOpAfterRemoveFlow(this, other);
    }
}
