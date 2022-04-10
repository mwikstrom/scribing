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
import { SetMarkupAttr } from "./SetMarkupAttr";

const Props = {
    position: nonNegativeIntegerType,
    key: stringType,
};

const Data = {
    unset: constType("markup_attr"),
    at: Props.position,
    key: stringType,
};

const PropsType: RecordType<UnsetMarkupAttrProps> = recordType(Props);
const DataType: RecordType<UnsetMarkupAttrData> = recordType(Data);
const propsToData = ({position, key }: UnsetMarkupAttrProps): UnsetMarkupAttrData => ({
    unset: "markup_attr",
    at: position,
    key,
});

/**
 * The base record class for {@link UnsetMarkupAttr}
 * @public
 */
export const UnsetMarkupAttrBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link UnsetMarkupAttr}
 * @public
 */
export interface UnsetMarkupAttrProps {
    /** The markup position */
    position: number;

    key: string;
}

/**
 * Data of {@link UnsetMarkupAttr}
 * @public
 */
export interface UnsetMarkupAttrData {
    /** Data discriminator */
    unset: "markup_attr";

    /** {@inheritdoc UnsetMarkupAttrProps.position} */
    at: number;

    key: string;
}

/**
 * Represents an operation that sets a markup tag
 * @public
 * @sealed
 */
@FlowOperationRegistry.register
export class UnsetMarkupAttr extends UnsetMarkupAttrBase implements UnsetMarkupAttrProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => UnsetMarkupAttr);

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: UnsetMarkupAttrData): UnsetMarkupAttr {
        const { key, at: position } = data;
        const props: UnsetMarkupAttrProps = { key, position };
        return new UnsetMarkupAttr(props);
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
                return null;
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
        if (next instanceof UnsetMarkupAttr && next.position === this.position && next.key === this.key) {
            return next;
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
        const { position, key } = this;
        const { node } = content.peek(position);
        if (node instanceof StartMarkup || node instanceof EmptyMarkup) {
            return content.replace(
                FlowRange.at(position, node.size),
                node.merge({ attr: Object.freeze(new Map([...Array.from(node.attr).filter(([k]) => k !== key)])) }),
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
