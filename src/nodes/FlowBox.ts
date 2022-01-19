import { 
    frozen, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating
} from "paratype";
import { BoxStyle } from "../styles/BoxStyle";
import { FlowContent } from "../structure/FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { ParagraphStyle } from "../styles/ParagraphStyle";
import { TextStyle } from "../styles/TextStyle";
import type { FlowNodeVisitor } from "../structure/FlowNodeVisitor";

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
@frozen
@validating
@FlowNodeRegistry.register
export class FlowBox extends FlowBoxBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowBox);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: FlowBoxData): FlowBox {
        const { box: content, style = BoxStyle.empty } = data;
        return new FlowBox({ content, style });
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept(visitor: FlowNodeVisitor): FlowNode {
        return visitor.visitBox(this);
    }

    /** {@inheritdoc FlowNode.completeUpload} */
    completeUpload(id: string, url: string): FlowNode {
        return this.set("content", this.content.completeUpload(id, url));
    }

    /** {@inheritdoc FlowNode.formatBox} */
    public formatBox(@type(Props.style) style: BoxStyle): this {
        return this.set("style", this.style.merge(style));
    }

    /** {@inheritdoc FlowNode.formatText} */
    public formatText(/*style: TextStyle, theme?: FlowTheme*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        // const range = FlowRange.at(0, this.content.size);
        // return this.set("content", this.content.formatText(range, style, this.getInnerTheme(theme)));
    }

    /** {@inheritdoc FlowNode.formatParagraph} */
    public formatParagraph(/*style: ParagraphStyle, theme?: FlowTheme*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        // const range = FlowRange.at(0, this.content.size);
        // return this.set("content", this.content.formatParagraph(range, style, this.getInnerTheme(theme)));
    }

    /**
     * {@inheritDoc FlowNode.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(/*theme?: ParagraphTheme, diff?: Set<keyof ParagraphStyleProps>,*/
    ): ParagraphStyle | null {
        return null;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        // const range = FlowRange.at(0, this.content.size);
        // const selection = new FlowRangeSelection({ range });
        // return selection.getUniformParagraphStyle(this.content, this.getInnerTheme(theme), diff);
    }

    /**
     * {@inheritDoc FlowNode.getUniformTextStyle}
     * @override
     */
    public getUniformTextStyle(/*theme?: ParagraphTheme, diff?: Set<keyof TextStyleProps>,*/
    ): TextStyle | null {
        return null;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        // const range = FlowRange.at(0, this.content.size);
        // const selection = new FlowRangeSelection({ range });
        // return selection.getUniformTextStyle(this.content, this.getInnerTheme(theme), diff);
    }

    /** {@inheritdoc FlowNode.unformatAmbient} */
    public unformatAmbient(/*theme: ParagraphTheme*/): this {
        return this.merge({
            style: this.style.unmerge(BoxStyle.ambient),
            // 2021-11-16: Do not cascade styling to nested content
            // TODO: Either re-enable that behavior or cleanup these comments
            // content: this.content.unformatAmbient(this.getInnerTheme(theme)),
        });
    }

    /** {@inheritdoc FlowNode.unformatBox} */
    public unformatBox(@type(Props.style) style: BoxStyle): this {
        return this.set("style", this.style.unmerge(style));
    }

    /** {@inheritdoc FlowNode.unformatText} */
    public unformatText(/*style: TextStyle*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        // const range = FlowRange.at(0, this.content.size);
        // return this.set("content", this.content.unformatText(range, style));
    }

    /** {@inheritdoc FlowNode.unformatParagraph} */
    public unformatParagraph(/*style: ParagraphStyle*/): this {
        return this;
        // 2021-11-16: Do not cascade styling to nested content
        // TODO: Either re-enable that behavior or cleanup these comments
        // const range = FlowRange.at(0, this.content.size);
        // return this.set("content", this.content.unformatParagraph(range, style));
    }

    // 2021-11-16: Do not cascade styling to nested content
    // TODO: Either re-enable that behavior or cleanup these comments
    /*private getInnerTheme(outer: ParagraphTheme | FlowTheme | undefined): FlowTheme {
        if (outer instanceof ParagraphTheme) {
            outer = outer.getFlowTheme();
        }
        return (outer ?? DefaultFlowTheme.instance).getBoxTheme(this.style);
    }*/
}
