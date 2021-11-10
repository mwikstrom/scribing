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
import { FlowContent } from "../structure/FlowContent";
import { FlowCursor } from "../selection/FlowCursor";
import { FlowNode } from "../nodes/FlowNode";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowSelection } from "../selection/FlowSelection";
import { InlineNode } from "../nodes/InlineNode";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { RemoveRange } from "./RemoveRange";
import { FlowOperationRegistry } from "../internal/class-registry";

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

/**
 * The base record class for {@link InsertContent}
 * @public
 */
export const InsertContentBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of insert content operations
 * @public
 */
export interface InsertContentProps {
    /** The insertion position */
    position: number;

    /** The content to be inserted */
    content: FlowContent;
}

/**
 * Data of insert content operations
 * @public
 */
export interface InsertContentData {
    /** {@inheritdoc InsertContentProps.content} */
    insert: FlowContent;

    /** {@inheritdoc InsertContentProps.position} */
    at: number;
}

/**
 * Represents an operation that insert flow content.
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class InsertContent extends InsertContentBase implements InsertContentProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => InsertContent);

    /** Gets an instance of the current class from the specified data */
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
        return new RemoveRange({ range: FlowRange.at(this.position, this.content.size).reverse() });
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof InsertContent && next.position === this.position + this.content.size) {
            return this.set("content", FlowContent.fromData([...this.content.nodes, ...next.content.nodes]));
        } else {
            return null;
        }
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
     * Moves the position of the current insertion operation by the specified delta
     * @internal
     */
    translate(delta: number): InsertContent {
        return this.set("position", this.position + delta);
    }

    /** 
     * {@inheritDoc FlowOperation.applyToContent}
     */
    applyToContent(content: FlowContent, theme?: FlowTheme): FlowContent {
        const target = content.peek(this.position);
        const targetParaStyle = target.getParagraphStyle();
        let targetTextStyle = target.getTextStyle();
        const nodes: FlowNode[] = [];

        for (
            let source: FlowCursor | null = this.content.peek(0);
            source !== null;
            source = source?.moveToStartOfNextNode()
        ) {
            let { node } = source;
            
            if (node === null) {
                continue;
            }

            if (node instanceof ParagraphBreak) {
                if (targetParaStyle !== null) {
                    node = node.formatParagraph(targetParaStyle.merge(node.style));
                }
                targetTextStyle = null;
            }

            if (targetTextStyle && node instanceof InlineNode) {
                node = node.formatText(targetTextStyle.merge(node.style));
            }

            nodes.push(node);
        }

        return content.insert(this.position, theme, ...nodes);
    }

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(selection: FlowSelection, mine: boolean): FlowSelection | null {
        return selection.afterInsertion(FlowRange.at(this.position, this.content.size), mine);
    }
}
