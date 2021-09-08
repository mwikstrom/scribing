import { 
    constType,
    frozen, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating
} from "paratype";

import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FormatText } from "./FormatText";
import { registerOperation } from "./internal/operation-registry";
import { 
    transformEdgeInflatingRangeOpAfterInsertion, 
    transformRangeOpAfterRemoval
} from "./internal/transform-helpers";
import { TextStyle } from "./TextStyle";

const Props = {
    range: FlowRange.classType,
    style: TextStyle.classType,
};

const Data = {
    unformat: constType("text"),
    range: Props.range,
    style: TextStyle.classType,
};

const PropsType: RecordType<UnformatTextProps> = recordType(Props);
const DataType: RecordType<UnformatTextData> = recordType(Data);
const propsToData = ({range, style}: UnformatTextProps): UnformatTextData => ({ unformat: "text", range, style });
const BASE = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of unformat text operations
 * @public
 */
export interface UnformatTextProps {
    range: FlowRange;
    style: TextStyle;
}

/**
 * Data of unformat text operations
 * @public
 */
export interface UnformatTextData {
    unformat: "text",
    range: FlowRange;
    style: TextStyle;
}

/**
 * Represents an operation that applies a text style to a range of flow content.
 * @sealed
 * @public
 */
@frozen
@validating
@registerOperation
export class UnformatText extends BASE implements Readonly<UnformatTextProps> {
    public static readonly classType = recordClassType(() => UnformatText);

    public static fromData(@type(DataType) data: UnformatTextData): UnformatText {
        const { range, style } = data;
        const props: UnformatTextProps = { range, style };
        return new UnformatText(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(state: FlowContent): FlowOperation | null {
        let position = this.range.first;
        const operations: FlowOperation[] = [];

        for (const node of state.peek(position).range(this.range.size)) {
            const nodeStyle = node.getTextStyle();

            if (nodeStyle !== null) {
                const format = new Map();

                for (const key of this.style.assigned) {
                    const nodeValue = nodeStyle.get(key);
                    if (nodeValue !== void(0)) {
                        format.set(key, nodeValue);
                    }
                }

                if (format.size > 0) {
                    operations.push(new FormatText({
                        range: FlowRange.at(position, node.size),
                        style: new TextStyle(Object.fromEntries(format)),
                    }));
                }
            }

            position += node.size;
        }

        return FlowOperation.batch(operations);
    }

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(other: FlowOperation): FlowOperation | null {
        // Formatting does not affect other operation
        return other;
    }

    /**
     * {@inheritDoc FlowOperation.applyTo}
     * @override
     */
    applyTo(container: FlowContent): FlowContent {
        return container.unformatText(this.range, this.style);
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertion}
     */
    afterInsertion(other: FlowRange): FlowOperation | null {
        return transformEdgeInflatingRangeOpAfterInsertion(this, other);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoval}
     */
    afterRemoval(other: FlowRange): FlowOperation | null {
        return transformRangeOpAfterRemoval(this, other);
    }
}
