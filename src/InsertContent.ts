import { 
    arrayType, 
    frozen, 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating, 
} from "paratype";
import { FlowContent } from "./FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { flowNodeType } from "./internal/node-registry";
import { registerOperation } from "./internal/operation-registry";
import { RemoveRange } from "./RemoveRange";

const Props = {
    position: nonNegativeIntegerType,
    nodes: arrayType(flowNodeType).frozen(),
};

const Data = {
    insert: Props.nodes,
    at: Props.position,
};

const PropsType: RecordType<InsertContentProps> = recordType(Props);
const DataType: RecordType<InsertContentData> = recordType(Data);
const propsToData = ({position, nodes }: InsertContentProps): InsertContentData => ({
    insert: nodes,
    at: position,
});

const BASE = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of insert content operations
 * @public
 */
export interface InsertContentProps {
    position: number;
    nodes: readonly FlowNode[];
}

/**
 * Data of insert content operations
 * @public
 */
export interface InsertContentData {
    insert: readonly FlowNode[];
    at: number;
}

/**
 * Represents an operation that insert flow content.
 * @public
 * @sealed
 */
@frozen
@validating
@registerOperation
export class InsertContent extends BASE implements InsertContentProps {
    public static readonly classType = recordClassType(() => InsertContent);

    public static fromData(@type(DataType) data: InsertContentData): InsertContent {
        const { insert: nodes, at: position } = data;
        const props: InsertContentProps = { position, nodes };
        return new InsertContent(props);
    }

    #computedSize: number | undefined;

    get size(): number {
        if (typeof this.#computedSize !== "number") {
            let result = 0;
            this.nodes.forEach(node => result += node.size);
            this.#computedSize = result;
        }
        return this.#computedSize;
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertion}
     */
    afterInsertion(other: FlowRange): FlowOperation | null {
        // Not affected when other insertion is empty
        if (other.isCollapsed) {
            return this;
        }

        // Not affected when other insertion is after op's insertion point
        if (other.first > this.position) {
            return this;
        }

        // Translate insertion point by the length of the other insertion
        return this.translate(other.size);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoval}
     */
    afterRemoval(other: FlowRange): FlowOperation | null {
        // Not affected when the removed range is empty
        if (other.isCollapsed) {
            return this;
        }

        // Not affected when removed range is after op's insertion point,
        if (other.first > this.position) {
            return this;
        }

        // Translate insertion when op's insertion point is after the removed range    
        if (this.position > other.last) {
            return this.translate(-other.size);
        }

        // Otherwise, this insertion is cancelled because it occurs within the removed range
        return null;        
    }

    /** 
     * {@inheritDoc FlowOperation.invert}
     */
    invert(): FlowOperation | null {
        return new RemoveRange({ range: FlowRange.at(this.position, this.size) });
    }

    /**
     * {@inheritDoc FlowOperation.toData}
     */
    toData(): InsertContentData {
        return { insert: this.nodes, at: this.position };
    }

    /** 
     * {@inheritDoc FlowOperation.transform}
     */
    transform(other: FlowOperation): FlowOperation | null {
        return other.afterInsertion(FlowRange.at(this.position, this.size));
    }

    /**
     * @internal
     */
    translate(distance: number): InsertContent {
        return this.set("position", this.position + distance);
    }

    /** 
     * {@inheritDoc FlowOperation.apply}
     */
    apply(container: FlowContent): FlowContent {
        // TODO: Merge formatting (both text and para) from existing content?!
        return container.insert(this.position, ...this.nodes);
    }
}
