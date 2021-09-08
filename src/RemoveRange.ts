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
     * {@inheritDoc FlowOperation.afterInsertion}
     * @override
     */
    afterInsertion(other: FlowRange): RemoveRange {
        // Translated when insertion was made before or at start
        if (other.first <= this.range.first) {
            return this.set("range", this.range.translate(other.size));
        }

        // Inflated when insertion was made inside
        if (other.first < this.range.last) {
            return this.set("range", this.range.inflate(other.size));
        }
        
        // Otherwise, unaffected
        return this;
    }

    /**
     * {@inheritDoc FlowOperation.afterRemoval}
     * @override
     */
    afterRemoval(other: FlowRange): RemoveRange | null {
        let { range } = this;

        // Unaffected when other remove was made at or after end
        if (other.first >= range.last) {
            return this;
        }

        // Deflated when other removal insersect with this
        const intersection = range.intersect(other); 
        if (intersection.size > 0) {
            range = range.deflate(intersection.size);

            // Cancelled when deflated to nothing
            if (range.isCollapsed) {
                return null;
            }
        }       

        // Translated when other removal was made before start
        if (other.first < range.first) {
            range = range.translate(intersection.size - other.size);
        }

        return this.set("range", range);
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
}
