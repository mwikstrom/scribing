import {
    frozen,
    mapType,
    RecordClass,
    recordClassType,
    recordType,
    RecordType,
    stringType,
    type,
    validating
} from "paratype";
import { InlineNode } from "./InlineNode";
import { FlowNodeRegistry } from "../internal/class-registry";
import { TextStyle } from "../styles/TextStyle";
import type { FlowNodeVisitor } from "../structure/FlowNodeVisitor";
import type { FlowNode } from "./FlowNode";

const Props = {
    tag: stringType,
    style: TextStyle.classType,
    attr: mapType(stringType).frozen(),
};
const Data = {
    start_markup: stringType,
    style: Props.style,
    attr: Props.attr,
};
const PropsType: RecordType<StartMarkupProps> = recordType(Props);
const DataType: RecordType<StartMarkupData> = recordType(Data).withOptional("style", "attr");
const propsToData = ({tag, style, attr}: StartMarkupProps): StartMarkupData => {
    const data: StartMarkupData = { start_markup: tag };
    if (!style.isEmpty) {
        data.style = style;
    }
    if (attr.size > 0) {
        data.attr = attr;
    }
    return data;
};

/**
 * The base record class for {@link StartMarkup}
 * @public
 */
export const StartMarkupBase = RecordClass(PropsType, InlineNode, DataType, propsToData);

/**
 * Properties of {@link StartMarkup}
 * @public
 */
export interface StartMarkupProps {
    tag: string;
    style: TextStyle;
    attr: Readonly<Map<string, string>>;
}

/**
 * Data of {@link StartMarkup}
 * @public
 */
export interface StartMarkupData {
    start_markup: string;
    style?: TextStyle;
    attr?: Readonly<Map<string, string>>;
}

/**
 * Represents a line break.
 * @public
 * @sealed
 */
@frozen
@validating
@FlowNodeRegistry.register
export class StartMarkup extends StartMarkupBase implements StartMarkupProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => StartMarkup);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: StartMarkupData): StartMarkup {
        const { start_markup: tag, style = TextStyle.empty, attr = new Map()} = data;
        const props: StartMarkupProps = { tag, style, attr: Object.freeze(attr) };
        return new StartMarkup(props);
    }

    constructor(props: StartMarkupProps) {
        super(props);
    }

    /** {@inheritdoc FlowNode.accept} */
    public accept(visitor: FlowNodeVisitor): FlowNode {
        return visitor.visitStartMarkup(this);
    }
}
