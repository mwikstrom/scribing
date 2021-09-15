import { frozen, type, validating } from "paratype";
import { FlowBatch } from "./FlowBatch";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection } from "./FlowSelection";
import { FormatParagraph } from "./FormatParagraph";
import { FormatText } from "./FormatText";
import { InsertContent } from "./InsertContent";
import { ParagraphStyle } from "./ParagraphStyle";
import { RemoveRange } from "./RemoveRange";
import { TextStyle } from "./TextStyle";
import { UnformatParagraph } from "./UnformatParagraph";
import { UnformatText } from "./UnformatText";

/**
 * @public
 * @sealed
 */
@frozen
@validating
export class RangeSelection extends FlowSelection {
    public readonly range: FlowRange;

    public constructor(@type(FlowRange.classType) range: FlowRange) {
        super();
        this.range = range;
    }

    public formatParagraph(@type(ParagraphStyle.classType) style: ParagraphStyle): FlowOperation | null {
        const { range } = this;
        return new FormatParagraph({ range, style });
    }

    public formatText(@type(TextStyle.classType) style: TextStyle): FlowOperation | null {
        const { range } = this;
        return new FormatText({ range, style });
    }

    public insert(@type(FlowContent.classType) content: FlowContent): FlowOperation | null {
        const { range } = this;
        const { first: position } = range;
        if (this.range.isCollapsed) {
            return new InsertContent({ position, content });
        } else {
            return FlowBatch.fromArray([
                new RemoveRange({ range }),
                new InsertContent({ position, content }),
            ]);
        }
    }

    public remove(): FlowOperation | null {
        const { range } = this;
        return new RemoveRange({ range });
    }

    public unformatParagraph(@type(ParagraphStyle.classType) style: ParagraphStyle): FlowOperation | null {
        const { range } = this;
        return new UnformatParagraph({ range, style });
    }

    public unformatText(@type(TextStyle.classType) style: TextStyle): FlowOperation | null {
        const { range } = this;
        return new UnformatText({ range, style });
    }
}
