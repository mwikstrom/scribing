import { 
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
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { registerOperation } from "./internal/operation-registry";
import { RemoveRange } from "./RemoveRange";

const Props = {
    position: nonNegativeIntegerType,
    content: FlowContent.classType,
};

const Data = {
    insert: Props.content,
    at: Props.position,
};

const PropsType: RecordType<InsertContentProps> = recordType(Props);
const DataType: RecordType<InsertContentData> = recordType(Data);
const propsToData = ({position, content }: InsertContentProps): InsertContentData => ({
    insert: content,
    at: position,
});

const BASE = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of insert content operations
 * @public
 */
export interface InsertContentProps {
    position: number;
    content: FlowContent;
}

/**
 * Data of insert content operations
 * @public
 */
export interface InsertContentData {
    insert: FlowContent;
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
        const { insert: content, at: position } = data;
        const props: InsertContentProps = { position, content };
        return new InsertContent(props);
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

        // Not affected when removed range is at or after op's insertion point,
        if (other.first >= this.position) {
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
        return new RemoveRange({ range: FlowRange.at(this.position, this.content.size) });
    }

    /**
     * {@inheritDoc FlowOperation.toData}
     */
    toData(): InsertContentData {
        return { insert: this.content, at: this.position };
    }

    /** 
     * {@inheritDoc FlowOperation.transform}
     */
    transform(other: FlowOperation): FlowOperation | null {
        return other.afterInsertion(FlowRange.at(this.position, this.content.size));
    }

    /**
     * @internal
     */
    translate(distance: number): InsertContent {
        return this.set("position", this.position + distance);
    }

    /** 
     * {@inheritDoc FlowOperation.applyTo}
     */
    applyTo(content: FlowContent): FlowContent {
        // TODO: Merge formatting (both text and para) from existing content?!
        return content.insert(this.position, ...this.content.nodes);
    }
}
