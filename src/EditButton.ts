import { 
    constType,
    frozen, 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    type, 
    validating 
} from "paratype";
import { FlowButton } from "./FlowButton";
import { FlowContent } from "./FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowOperation } from "./FlowOperation";
import { FlowOperationRegistry } from "./internal/class-registry";
import { NestedFlowOperation } from "./NestedFlowOperation";

const Props = {
    position: nonNegativeIntegerType,
    inner: FlowOperation.baseType,
};

const Data = {
    edit: constType("button"),
    at: Props.position,
    op: FlowOperation.baseType,
};

const PropsType: RecordType<EditButtonProps> = recordType(Props);
const DataType: RecordType<EditButtonData> = recordType(Data);
const propsToData = ({position, inner }: EditButtonProps): EditButtonData => ({
    edit: "button",
    at: position,
    op: inner,
});

/**
 * The base record class for {@link EditButton}
 * @public
 */
export const EditButtonBase = RecordClass(PropsType, NestedFlowOperation, DataType, propsToData);

/**
 * Properties of {@link EditButton}
 * @public
 */
export interface EditButtonProps {
    /** The button position */
    position: number;

    /** The inner operation */
    inner: FlowOperation;
}

/**
 * Data of {@link EditButton}
 * @public
 */
export interface EditButtonData {
    /** Data discriminator */
    edit: "button";

    /** {@inheritdoc EditButtonProps.position} */
    at: number;

    /** {@inheritdoc EditButtonProps.inner} */
    op: FlowOperation;
}

/**
 * Represents an operation that edit the content of a button
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class EditButton extends EditButtonBase implements EditButtonProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => EditButton);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: EditButtonData): EditButton {
        const { op: inner, at: position } = data;
        const props: EditButtonProps = { inner, position };
        return new EditButton(props);
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof EditButton && next.position === this.position) {
            const merged = this.inner.mergeNext(next.inner);
            if (merged !== null) {
                return this.set("inner", merged);
            }
        }
        return null;
    }

    /** 
     * {@inheritDoc NestedFlowOperation.createReplacementNode}
     */
    createReplacementNode(content: FlowContent, before: FlowNode): FlowNode {
        if (before instanceof FlowButton) {
            return before.set("content", content);
        } else {
            throw new Error("Expected a flow button to replace");
        }
    }

    /** 
     * {@inheritDoc NestedFlowOperation.getInnerContentFromNode}
     */
    getInnerContentFromNode(node: FlowNode): FlowContent {
        if (node instanceof FlowButton) {
            return node.content;
        } else {
            throw new Error(`Expected a flow button at position ${this.position}`);
        }
    }
}
