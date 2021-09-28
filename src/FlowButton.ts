import { 
    frozen, 
    nullType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    unionType, 
    validating
} from "paratype";
import { FlowContent } from "./FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowRange } from "./FlowRange";
import { FlowRangeSelection } from "./FlowRangeSelection";
import { FlowTheme } from "./FlowTheme";
import { Interaction } from "./Interaction";
import { FlowNodeRegistry } from "./internal/class-registry";
import { ParagraphStyle, ParagraphStyleProps } from "./ParagraphStyle";
import { ParagraphTheme } from "./ParagraphTheme";
import { TextStyle, TextStyleProps } from "./TextStyle";

const Props = {
    content: FlowContent.classType,
    action: unionType(nullType, Interaction.baseType),
};

const Data = {
    button: FlowContent.classType,
    action: Interaction.baseType,
};

const PropsType: RecordType<FlowButtonProps> = recordType(Props);
const DataType: RecordType<FlowButtonData> = recordType(Data).withOptional("action");

const propsToData = ({ content: button, action }: FlowButtonProps): FlowButtonData => (
    action ? { button, action } : { button }
);

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
    action: Interaction | null;
}

/**
 * Data of {@link FlowButton}
 * @public
 */
export interface FlowButtonData {
    button: FlowContent;
    action?: Interaction;
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
        const { button: content, action = null } = data;
        return new FlowButton({ content, action });
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
