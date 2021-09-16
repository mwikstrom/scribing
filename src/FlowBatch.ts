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
import { FlowSelection } from "./FlowSelection";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { flowOperationType, registerOperation } from "./internal/operation-registry";
import { FlowTheme } from "./FlowTheme";

const DataType = arrayType(flowOperationType);
const Props = { operations: DataType.frozen() };
const PropsType: RecordType<FlowBatchProps> = recordType(Props);
const propsToData = (props: FlowBatchProps): FlowBatchData => props.operations;
const EMPTY_PROPS: FlowBatchProps = Object.freeze({ operations: Object.freeze([]) });

/**
 * The base record class for {@link FlowBatch}
 * @public
 */
export const FlowBatchBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

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
export class FlowBatch extends FlowBatchBase implements Readonly<FlowBatchProps> {
    /** The run-time type that represents this class */
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
     * Gets a single operation that represents the specified array of operations,
     * or `null` when the specified array is empty.
     */
    public static fromArray(operations: FlowOperation[]): FlowOperation | null {
        if (operations.length === 0) {
            return null;
        } else if (operations.length === 1) {
            return operations[0];
        } else {
            Object.freeze(operations);
            return new FlowBatch({ operations });
        }
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
    invert(content: FlowContent): FlowOperation | null {
        const newOperations: FlowOperation[] = [];

        for (const op of this.operations) {
            const inverted = op.invert(content);

            if (inverted === null) {
                return null;
            }

            content = op.applyToContent(content);
            newOperations.unshift(inverted);
        }

        return this.set("operations", Object.freeze(newOperations));
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
     * {@inheritDoc FlowOperation.applyToContent}
     */
    applyToContent(content: FlowContent, theme?: FlowTheme): FlowContent {
        for (const op of this.operations) {
            content = op.applyToContent(content, theme);
        }
        return content;
    }

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(selection: FlowSelection, mine: boolean): FlowSelection | null {
        for (const op of this.operations) {
            const updated = op.applyToSelection(selection, mine);
            if (updated === null) {
                return null;
            }
            selection = updated;
        }
        return selection;
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
            return this.set("operations", Object.freeze(result));
        }
    }
}
