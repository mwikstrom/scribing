import {
    mapType,
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
    stringType,
} from "paratype";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { TextStyle } from "../styles/TextStyle";
import type { GenericFlowNodeVisitor } from "../structure/GenericFlowNodeVisitor";
import { AttrValue, attrValueType } from "./AttrValue";

const Props = {
    tag: stringType,
    style: TextStyle.classType,
    attr: mapType(attrValueType),
};
const Data = {
    empty_markup: stringType,
    style: Props.style,
    attr: Props.attr,
};
const PropsType: RecordType<EmptyMarkupProps> = recordType(Props);
const DataType: RecordType<EmptyMarkupData> = recordType(Data).withOptional("style", "attr");
const propsToData = ({tag, style, attr}: EmptyMarkupProps): EmptyMarkupData => {
    const data: EmptyMarkupData = { empty_markup: tag };
    if (!style.isEmpty) {
        data.style = style;
    }
    if (attr.size > 0) {
        data.attr = attr;
    }
    return data;
};

/**
 * The base record class for {@link EmptyMarkup}
 * @public
 */
export const EmptyMarkupBase = RecordClass(PropsType, InlineNode, DataType, propsToData);

/**
 * Properties of {@link EmptyMarkup}
 * @public
 */
export interface EmptyMarkupProps {
    tag: string;
    style: TextStyle;
    attr: Readonly<Map<string, AttrValue>>;
}

/**
 * Data of {@link EmptyMarkup}
 * @public
 */
export interface EmptyMarkupData {
    empty_markup: string;
    style?: TextStyle;
    attr?: Readonly<Map<string, AttrValue>>;
}

/**
 * Represents a line break.
 * @public
 * @sealed
 */
@FlowNodeRegistry.register
export class EmptyMarkup extends EmptyMarkupBase implements EmptyMarkupProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => EmptyMarkup);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: EmptyMarkupData): EmptyMarkup {
        const { empty_markup: tag, style = TextStyle.empty, attr = new Map()} = data;
        const props: EmptyMarkupProps = { tag, style, attr: Object.freeze(attr) };
        return new EmptyMarkup(props);
    }

    constructor(props: EmptyMarkupProps) {
        super(props);
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept<T>(visitor: GenericFlowNodeVisitor<T>): T {
        return visitor.visitEmptyMarkup(this);
    }
}
