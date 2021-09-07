import { 
    arrayType, 
    frozen, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating, 
} from "paratype";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { flowOperationType, registerOperation } from "./internal/operation-registry";

const DataType = arrayType(flowOperationType);
const Props = { operations: DataType.frozen() };
const PropsType: RecordType<FlowBatchProps> = recordType(Props);
const propsToData = (props: FlowBatchProps): FlowBatchData => props.operations;
const EMPTY_PROPS: FlowBatchProps = Object.freeze({ operations: Object.freeze([]) });
const BASE = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link FlowBatch}
 * @public
 */
export interface FlowBatchProps {
    /** Operations to be applied atomically */
    operations: readonly FlowOperation[] 
}

/**
 * Data of {@link FlowBatch}
 * @public
 */
export type FlowBatchData = readonly FlowOperation[];

/**
 * Represents a batch of flow operations that are applied sequentially and atomically.
 * @public
 * @sealed
 */
@frozen
@validating
@registerOperation
export class FlowBatch extends BASE implements Readonly<FlowBatchProps> {
    public static readonly classType = recordClassType(() => FlowBatch);

    /**
     * Gets a {@link FlowBatch} from the specified data
     * @param data - The data
     */
    public static fromData(@type(DataType) data: FlowBatchData): FlowBatch {
        const props: FlowBatchProps = { operations: Object.freeze(data) };
        return new FlowBatch(props);
    }

    /**
     * Constructs a new {@link FlowBatch} instance with the specified properties.
     * @param props - The properties to assign
     */
    constructor(props: FlowBatchProps = EMPTY_PROPS) {
        super(props);
    }

    /** 
     * {@inheritDoc FlowOperation.invert}
     */
    invert(state: FlowContent): FlowOperation | null {
        const newOperations: FlowOperation[] = [];

        for (const op of this.operations) {
            const inverted = op.invert(state);

            if (inverted === null) {
                return null;
            }

            state = op.apply(state);
            newOperations.unshift(inverted);
        }

        return this.set("operations", newOperations);
    }

    /** 
     * {@inheritDoc FlowOperation.transform}
     */
    transform(other: FlowOperation): FlowOperation | null {
        for (const op of this.operations) {
            const transformed = op.transform(other);
            if (transformed === null) {
                return null;
            }
            other = transformed;
        }
        return other;
    }

    /** 
     * {@inheritDoc FlowOperation.apply}
     */
    apply(container: FlowContent): FlowContent {
        for (const op of this.operations) {
            container = op.apply(container);
        }
        return container;
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertion}
     */
    afterInsertion(other: FlowRange): FlowOperation | null {
        return this.#map(op => op.afterInsertion(other));
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoval}
     */
    afterRemoval(other: FlowRange): FlowOperation | null {
        return this.#map(op => op.afterRemoval(other));
    }

    #map(func: (op: FlowOperation) => FlowOperation | null): FlowBatch | null {
        const result: FlowOperation[] = [];
        let modified = false;

        for (const before of this.operations) {
            const after = func(before);
            if (!after) {
                modified = true;
                continue;
            }
            if (!modified && !flowOperationType.equals(before, after)) {
                modified = true;
            }
            result.push(after);
        }

        if (!modified) {
            return this;
        } else if (result.length === 0) {
            return new FlowBatch();
        } else {
            return this.set("operations", result);
        }
    }
}
