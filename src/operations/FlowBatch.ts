import { 
    arrayType, 
    lazyType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType,
    Type, 
} from "paratype";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowOperationRegistry } from "../internal/class-registry";

const DataType: Type<readonly FlowOperation[]> = arrayType(lazyType(FlowOperationRegistry.close));
const Props = { operations: DataType };
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
@FlowOperationRegistry.register
export class FlowBatch extends FlowBatchBase implements Readonly<FlowBatchProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowBatch);

    /**
     * Gets a {@link FlowBatch} from the specified data
     * @param data - The data
     */
    public static fromData(data: FlowBatchData): FlowBatch {
        const props: FlowBatchProps = { operations: Object.freeze(data) };
        return new FlowBatch(props);
    }

    /**
     * Gets a single operation that represents the specified array of operations,
     * or `null` when the specified array is empty.
     */
    public static fromArray(operations: (FlowOperation | null)[]): FlowOperation | null {
        const queue = [...operations];
        const flattened: FlowOperation[] = [];

        for(;;) {
            let next = queue.shift();
            if (!next) {
                break;
            } else if (next instanceof FlowBatch) {
                queue.unshift(...next.operations);
            } else if (next instanceof FlowOperation) {
                const prev = flattened.pop();
                if (prev) {
                    const merged = prev.mergeNext(next);
                    if (merged) {
                        next = merged;
                    } else {
                        flattened.push(prev);
                    }
                }
                flattened.push(next);
            }
        }
   
        if (flattened.length === 0) {
            return null;
        } else if (flattened.length === 1) {
            return flattened[0];
        } else {
            return new FlowBatch({ operations: Object.freeze(flattened) });
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
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof FlowBatch && next.operations.length === 0) {
            return this;
        }

        if (this.operations.length === 0) {
            return next;
        }

        const last = this.operations[this.operations.length - 1];
        const merged = last.mergeNext(next);

        if (merged === null) {
            return null;
        }

        const newOperations = [
            ...this.operations.slice(0, this.operations.length - 1),
            merged,
        ];

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
     * {@inheritDoc FlowOperation.afterInsertFlow}
     */
    afterInsertFlow(other: FlowRange): FlowOperation | null {
        return this.#map(op => op.afterInsertFlow(other));
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoveFlow}
     */
    afterRemoveFlow(other: FlowRange): FlowOperation | null {
        return this.#map(op => op.afterRemoveFlow(other));
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
            if (!modified && !FlowOperation.baseType.equals(before, after)) {
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
