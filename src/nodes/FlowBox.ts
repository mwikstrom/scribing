import { 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
} from "paratype";
import { BoxStyle } from "../styles/BoxStyle";
import { FlowContent } from "../structure/FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { ParagraphStyle } from "../styles/ParagraphStyle";
import { TextStyle } from "../styles/TextStyle";
import type { GenericFlowNodeVisitor } from "../structure/GenericFlowNodeVisitor";

const Props = {
    content: FlowContent.classType,
    style: BoxStyle.classType,
};

const Data = {
    box: FlowContent.classType,
    style: BoxStyle.classType,
};

const PropsType: RecordType<FlowBoxProps> = recordType(Props);
const DataType: RecordType<FlowBoxData> = recordType(Data).withOptional("style");

const propsToData = ({ content: box, style }: FlowBoxProps): FlowBoxData => {
    style = style.unmerge(BoxStyle.ambient);
    return style.isEmpty ? { box } : { box, style };
};

/**
 * The base record class for {@link FlowBox}
 * @public
 */
export const FlowBoxBase = RecordClass(PropsType, FlowNode, DataType, propsToData);

/**
 * Properties of {@link FlowBox}
 * @public
 */
export interface FlowBoxProps {
    content: FlowContent;
    style: BoxStyle;
}

/**
 * Data of {@link FlowBox}
 * @public
 */
export interface FlowBoxData {
    box: FlowContent;
    style?: BoxStyle;
}

/**
 * Represents a flow box
 * @public
 * @sealed
 */
@FlowNodeRegistry.register
export class FlowBox extends FlowBoxBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowBox);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: FlowBoxData): FlowBox {
        const { box: content, style = BoxStyle.empty } = data;
        return new FlowBox({ content, style });
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept<T>(visitor: GenericFlowNodeVisitor<T>): T {
        return visitor.visitBox(this);
    }

    /** {@inheritdoc FlowNode.completeUpload} */
    completeUpload(id: string, url: string): FlowNode {
        return this.set("content", this.content.completeUpload(id, url));
    }

    /** {@inheritdoc FlowNode.formatBox} */
    public formatBox(style: BoxStyle): this {
        return this.set("style", this.style.merge(style));
    }

    /** {@inheritdoc FlowNode.formatText} */
    public formatText(): this {
        return this;
    }

    /** {@inheritdoc FlowNode.formatParagraph} */
    public formatParagraph(): this {
        return this;
    }

    /**
     * {@inheritDoc FlowNode.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(): ParagraphStyle | null {
        return null;
    }

    /**
     * {@inheritDoc FlowNode.getUniformTextStyle}
     * @override
     */
    public getUniformTextStyle(): TextStyle | null {
        return null;
    }

    /** {@inheritdoc FlowNode.unformatAmbient} */
    public unformatAmbient(): this {
        return this.merge({ style: this.style.unmerge(BoxStyle.ambient) });
    }

    /** {@inheritdoc FlowNode.unformatBox} */
    public unformatBox(style: BoxStyle): this {
        return this.set("style", this.style.unmerge(style));
    }

    /** {@inheritdoc FlowNode.unformatText} */
    public unformatText(): this {
        return this;
    }

    /** {@inheritdoc FlowNode.unformatParagraph} */
    public unformatParagraph(): this {
        return this;
    }
}
