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

import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { InsertContent } from "./InsertContent";
import { registerOperation } from "./internal/operation-registry";
import { transformRangeOpAfterInsertion, transformRangeOpAfterRemoval } from "./internal/transform-helpers";

const Props = {
    range: lazyType(() => FlowRange.classType),
};

const Data = {
    remove: Props.range,
};

const PropsType: RecordType<RemoveRangeProps> = recordType(Props);
const DataType: RecordType<RemoveRangeData> = recordType(Data);
const propsToData = ({range}: RemoveRangeProps): RemoveRangeData => ({ remove: range });
const BASE = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of remove range opertions
 * @public
 */
export interface RemoveRangeProps {
    range: FlowRange;
}

/**
 * Data of remove range operations
 * @public
 */
export interface RemoveRangeData {
    remove: FlowRange;
}

/**
 * Represents an operation that removes a range of flow.
 * @sealed
 * @public
 */
@frozen
@validating
@registerOperation
export class RemoveRange extends BASE implements Readonly<RemoveRangeProps> {
    public static readonly classType = recordClassType(() => RemoveRange);

    public static fromData(@type(DataType) data: RemoveRangeData): RemoveRange {
        const { remove: range } = data;
        const props: RemoveRangeProps = { range };
        return new RemoveRange(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(state: FlowContent): InsertContent {
        return new InsertContent({ position: this.range.first, content: state.copy(this.range) });
    }

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(other: FlowOperation): FlowOperation | null {
        return other.afterRemoval(this.range);
    }

    /**
     * {@inheritDoc FlowOperation.applyTo}
     * @override
     */
    applyTo(container: FlowContent): FlowContent {
        return container.remove(this.range);
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertion}
     */
    afterInsertion(other: FlowRange): FlowOperation | null {
        return transformRangeOpAfterInsertion(this, other);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoval}
     */
    afterRemoval(other: FlowRange): FlowOperation | null {
        return transformRangeOpAfterRemoval(this, other);
    }
}
