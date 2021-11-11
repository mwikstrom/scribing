import { 
    constType,
    frozen, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    type, 
    validating 
} from "paratype";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowOperationRegistry } from "../internal/class-registry";
import { FlowRangeSelection } from "../selection/FlowRangeSelection";

const Props = {
    content: FlowContent.classType,
};

const Data = {
    reset: constType("content"),
    content: FlowContent.classType,
};

const PropsType: RecordType<ResetContentProps> = recordType(Props);
const DataType: RecordType<ResetContentData> = recordType(Data);
const propsToData = ({content}: ResetContentProps): ResetContentData => ({
    reset: "content",
    content,
});

/**
 * The base record class for {@link ResetContent}
 * @public
 */
export const ResetContentBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link ResetContent}
 * @public
 */
export interface ResetContentProps {
    /** The new content */
    content: FlowContent;
}

/**
 * Data of {@link ResetContent}
 * @public
 */
export interface ResetContentData {
    /** Data discriminator */
    reset: "content";

    /** {@inheritdoc ResetContentProps.content} */
    content: FlowContent;
}

/**
 * Represents an operation that sets the path data of an icon
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class ResetContent extends ResetContentBase implements ResetContentProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => ResetContent);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) input: ResetContentData): ResetContent {
        const { content } = input;
        const props: ResetContentProps = { content };
        return new ResetContent(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        return new ResetContent({ content });
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof ResetContent) {
            return next;
        } else {
            return null;
        }
    }

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowOperation.applyToContent}
     * @override
     */
    applyToContent(): FlowContent {
        return this.content;
    }

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(): FlowSelection {
        return new FlowRangeSelection({ range: FlowRange.at(this.content.size)});
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertFlow}
     */
    afterInsertFlow(): FlowOperation | null {
        return this;
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoveFlow}
     */
    afterRemoveFlow(): FlowOperation | null {
        return this;
    }
}
