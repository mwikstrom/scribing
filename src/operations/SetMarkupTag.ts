import { 
    constType,
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    stringType, 
} from "paratype";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowOperationRegistry } from "../internal/class-registry";
import { getRangeAfterInsertion, getRangeAfterRemoval } from "../internal/transform-helpers";
import { StartMarkup } from "../nodes/StartMarkup";
import { EndMarkup } from "../nodes/EndMarkup";
import { EmptyMarkup } from "../nodes/EmptyMarkup";

const Props = {
    position: nonNegativeIntegerType,
    tag: stringType,
};

const Data = {
    set: constType("markup_tag"),
    at: Props.position,
    value: stringType,
};

const PropsType: RecordType<SetMarkupTagProps> = recordType(Props);
const DataType: RecordType<SetMarkupTagData> = recordType(Data);
const propsToData = ({position, tag }: SetMarkupTagProps): SetMarkupTagData => ({
    set: "markup_tag",
    at: position,
    value: tag,
});

/**
 * The base record class for {@link SetMarkupTag}
 * @public
 */
export const SetMarkupTagBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link SetMarkupTag}
 * @public
 */
export interface SetMarkupTagProps {
    /** The markup position */
    position: number;

    /** The tag to assign */
    tag: string;
}

/**
 * Data of {@link SetMarkupTag}
 * @public
 */
export interface SetMarkupTagData {
    /** Data discriminator */
    set: "markup_tag";

    /** {@inheritdoc SetMarkupTagProps.position} */
    at: number;

    /** {@inheritdoc SetMarkupTagProps.tag} */
    value: string;
}

/**
 * Represents an operation that sets a markup tag
 * @public
 * @sealed
 */
@FlowOperationRegistry.register
export class SetMarkupTag extends SetMarkupTagBase implements SetMarkupTagProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => SetMarkupTag);

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: SetMarkupTagData): SetMarkupTag {
        const { value: tag, at: position } = data;
        const props: SetMarkupTagProps = { tag, position };
        return new SetMarkupTag(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { position } = this;
        const { node } = content.peek(position);
        if (node instanceof EndMarkup || node instanceof StartMarkup || node instanceof EmptyMarkup) {
            const { tag } = node;
            return new SetMarkupTag({ position, tag });
        } else {
            return null;
        }
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof SetMarkupTag && next.position === this.position) {
            return this.set("tag", next.tag);
        } else {
            return null;
        }
    }

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(other: FlowOperation): FlowOperation | null {
        // Does not affect other operation
        return other;
    }

    /**
     * {@inheritDoc FlowOperation.applyToContent}
     * @override
     */
    applyToContent(content: FlowContent): FlowContent {
        const { position, tag } = this;
        const { node } = content.peek(position);
        if (node instanceof StartMarkup || node instanceof EndMarkup || node instanceof EmptyMarkup) {
            return content.replace(
                FlowRange.at(position, node.size),
                node.merge({ tag })
            );
        } else {
            return content;
        }
    }

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(selection: FlowSelection): FlowSelection {
        // Does not affect selection
        return selection;
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertFlow}
     */
    afterInsertFlow(range: FlowRange): FlowOperation | null {
        const before = FlowRange.at(this.position, 1);
        const after = getRangeAfterInsertion(before, range);
        return this.#wrapPosition(after);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoveFlow}
     */
    afterRemoveFlow(range: FlowRange): FlowOperation | null {
        const before = FlowRange.at(this.position, 1);
        const after = getRangeAfterRemoval(before, range);
        return this.#wrapPosition(after);
    }

    #wrapPosition(range: FlowRange | null): FlowOperation | null {
        if (range && range.size === 1) {
            return this.set("position", range.first);
        } else {
            return null;
        }
    }
}
