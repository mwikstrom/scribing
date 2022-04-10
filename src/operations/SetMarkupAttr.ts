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
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { UnsetMarkupAttr } from "./UnsetMarkupAttr";
import { AttrValue, attrValueType } from "../nodes/AttrValue";

const Props = {
    position: nonNegativeIntegerType,
    key: stringType,
    value: attrValueType,
};

const Data = {
    set: constType("markup_attr"),
    at: Props.position,
    key: stringType,
    value: attrValueType,
};

const PropsType: RecordType<SetMarkupAttrProps> = recordType(Props);
const DataType: RecordType<SetMarkupAttrData> = recordType(Data);
const propsToData = ({position, key, value }: SetMarkupAttrProps): SetMarkupAttrData => ({
    set: "markup_attr",
    at: position,
    key,
    value,
});

/**
 * The base record class for {@link SetMarkupAttr}
 * @public
 */
export const SetMarkupAttrBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link SetMarkupAttr}
 * @public
 */
export interface SetMarkupAttrProps {
    /** The markup position */
    position: number;

    key: string;

    value: AttrValue;
}

/**
 * Data of {@link SetMarkupAttr}
 * @public
 */
export interface SetMarkupAttrData {
    /** Data discriminator */
    set: "markup_attr";

    /** {@inheritdoc SetMarkupAttrProps.position} */
    at: number;

    key: string;

    value: AttrValue;
}

/**
 * Represents an operation that sets a markup tag
 * @public
 * @sealed
 */
@FlowOperationRegistry.register
export class SetMarkupAttr extends SetMarkupAttrBase implements SetMarkupAttrProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => SetMarkupAttr);

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: SetMarkupAttrData): SetMarkupAttr {
        const { key, value, at: position } = data;
        const props: SetMarkupAttrProps = { key, value, position };
        return new SetMarkupAttr(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { position, key } = this;
        const { node } = content.peek(position);
        if (node instanceof StartMarkup || node instanceof EmptyMarkup) {
            const value = node.attr.get(key);
            if (value === void(0)) {
                return new UnsetMarkupAttr({ position, key });
            } else {
                return new SetMarkupAttr({ position, key, value });
            }
        } else {
            return null;
        }
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof SetMarkupAttr && next.position === this.position && next.key === this.key) {
            return this.set("value", next.value);
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
        const { position, key, value } = this;
        const { node } = content.peek(position);
        if (node instanceof StartMarkup || node instanceof EmptyMarkup) {
            return content.replace(
                FlowRange.at(position, node.size),
                node.merge({ attr: Object.freeze(new Map(node.attr).set(key, value)) })
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
