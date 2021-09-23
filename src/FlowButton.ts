import { frozen, RecordClass, recordClassType, RecordType, recordType, type, validating } from "paratype";
import { FlowContent } from "./FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowRange } from "./FlowRange";
import { FlowRangeSelection } from "./FlowRangeSelection";
import { FlowTheme } from "./FlowTheme";
import { FlowNodeRegistry } from "./internal/class-registry";
import { ParagraphStyle, ParagraphStyleProps } from "./ParagraphStyle";
import { ParagraphTheme } from "./ParagraphTheme";
import { TextStyle, TextStyleProps } from "./TextStyle";

const Props = {
    content: FlowContent.classType,
};

const Data = {
    button: FlowContent.classType,
};

const PropsType: RecordType<FlowButtonProps> = recordType(Props);
const DataType: RecordType<FlowButtonData> = recordType(Data);

const propsToData = ({ content: button }: FlowButtonProps): FlowButtonData => ({ button });

/**
 * The base record class for {@link FlowButton}
 * @public
 */
export const FlowButtonBase = RecordClass(PropsType, FlowNode, DataType, propsToData);

/**
 * Properties of {@link FlowButton}
 * @public
 */
export interface FlowButtonProps {
    content: FlowContent;
}

/**
 * Data of {@link FlowButton}
 * @public
 */
export interface FlowButtonData {
    button: FlowContent;
}

/**
 * Represents a button in flow content
 * @public
 * @sealed
 */
@frozen
@validating
@FlowNodeRegistry.register
export class FlowButton extends FlowButtonBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowButton);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowButtonData): FlowButton {
        const { button: content } = data;
        return new FlowButton({ content });
    }

    /** {@inheritdoc FlowNode.formatText} */
    public formatText(style: TextStyle, theme?: FlowTheme): this {
        const range = FlowRange.at(0, this.content.size);
        return this.set("content", this.content.formatText(range, style, theme));
    }

    /** {@inheritdoc FlowNode.formatParagraph} */
    public formatParagraph(style: ParagraphStyle, theme?: FlowTheme): this {
        const range = FlowRange.at(0, this.content.size);
        return this.set("content", this.content.formatParagraph(range, style, theme));
    }

    /**
     * {@inheritDoc FlowNode.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(
        theme?: ParagraphTheme,
        diff?: Set<keyof ParagraphStyleProps>,
    ): ParagraphStyle | null {
        const range = FlowRange.at(0, this.content.size);
        const selection = new FlowRangeSelection({ range });
        return selection.getUniformParagraphStyle(this.content, theme?.getFlowTheme(), diff);
    }

    /**
     * {@inheritDoc FlowNode.getUniformTextStyle}
     * @override
     */
    public getUniformTextStyle(
        theme?: ParagraphTheme,
        diff?: Set<keyof TextStyleProps>,
    ): TextStyle {
        const range = FlowRange.at(0, this.content.size);
        const selection = new FlowRangeSelection({ range });
        return selection.getUniformTextStyle(this.content, theme?.getFlowTheme(), diff);
    }

    /** {@inheritdoc FlowNode.unformatAmbient} */
    public unformatAmbient(theme: ParagraphTheme): this {
        return this.set("content", this.content.unformatAmbient(theme.getFlowTheme()));
    }

    /** {@inheritdoc FlowNode.unformatText} */
    public unformatText(style: TextStyle): this {
        const range = FlowRange.at(0, this.content.size);
        return this.set("content", this.content.unformatText(range, style));
    }

    /** {@inheritdoc FlowNode.unformatParagraph} */
    public unformatParagraph(style: ParagraphStyle): this {
        const range = FlowRange.at(0, this.content.size);
        return this.set("content", this.content.unformatParagraph(range, style));
    }
}
