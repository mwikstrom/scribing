import { 
    constType,
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
} from "paratype";
import { DefaultFlowTheme } from "../styles/DefaultFlowTheme";
import { FlowBox } from "../nodes/FlowBox";
import { FlowContent } from "../structure/FlowContent";
import { FlowNode } from "../nodes/FlowNode";
import { FlowOperation } from "./FlowOperation";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowOperationRegistry } from "../internal/class-registry";
import { NestedFlowOperation } from "./NestedFlowOperation";

const Props = {
    position: nonNegativeIntegerType,
    inner: FlowOperation.baseType,
};

const Data = {
    edit: constType("box"),
    at: Props.position,
    op: FlowOperation.baseType,
};

const PropsType: RecordType<EditBoxProps> = recordType(Props);
const DataType: RecordType<EditBoxData> = recordType(Data);
const propsToData = ({position, inner }: EditBoxProps): EditBoxData => ({
    edit: "box",
    at: position,
    op: inner,
});

/**
 * The base record class for {@link EditBox}
 * @public
 */
export const EditBoxBase = RecordClass(PropsType, NestedFlowOperation, DataType, propsToData);

/**
 * Properties of {@link EditBox}
 * @public
 */
export interface EditBoxProps {
    /** The box position */
    position: number;

    /** The inner operation */
    inner: FlowOperation;
}

/**
 * Data of {@link EditBox}
 * @public
 */
export interface EditBoxData {
    /** Data discriminator */
    edit: "box";

    /** {@inheritdoc EditBoxProps.position} */
    at: number;

    /** {@inheritdoc EditBoxProps.inner} */
    op: FlowOperation;
}

/**
 * Represents an operation that edit the contents of a box
 * @public
 * @sealed
 */
@FlowOperationRegistry.register
export class EditBox extends EditBoxBase implements EditBoxProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => EditBox);

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: EditBoxData): EditBox {
        const { op: inner, at: position } = data;
        const props: EditBoxProps = { inner, position };
        return new EditBox(props);
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof EditBox && next.position === this.position) {
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
        if (before instanceof FlowBox) {
            return before.set("content", content);
        } else {
            throw new Error("Expected a flow box to replace");
        }
    }

    /** 
     * {@inheritDoc NestedFlowOperation.getInnerContentFromNode}
     */
    getInnerContentFromNode(node: FlowNode): FlowContent {
        if (node instanceof FlowBox) {
            return node.content;
        } else {
            throw new Error(`Expected a flow box at position ${this.position}`);
        }
    }

    /** 
     * {@inheritDoc NestedFlowOperation.getInnerThemeFromNode}
     */
    getInnerThemeFromNode(node: FlowNode, outer?: FlowTheme): FlowTheme {
        if (node instanceof FlowBox) {
            return (outer ?? DefaultFlowTheme.instance).getBoxTheme(node.style);
        } else {
            throw new Error(`Expected a flow box at position ${this.position}`);
        }
    }
}
