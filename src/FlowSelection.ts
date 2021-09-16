import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextStyle } from "./TextStyle";

/**
 * @public
 */
export abstract class FlowSelection {
    public abstract formatParagraph(style: ParagraphStyle): FlowOperation | null;

    public abstract formatText(style: TextStyle): FlowOperation | null;

    public abstract insert(content: FlowContent): FlowOperation | null;

    public abstract remove(): FlowOperation | null;

    public abstract unformatParagraph(style: ParagraphStyle): FlowOperation | null;

    public abstract unformatText(style: TextStyle): FlowOperation | null;

    /** @internal */
    abstract afterInsertion(range: FlowRange, mine: boolean): FlowSelection | null;

    /** @internal */
    abstract afterRemoval(range: FlowRange, mine: boolean): FlowSelection | null;
}
