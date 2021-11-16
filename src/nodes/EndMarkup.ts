import {
    frozen,
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

const Props = {
    tag: stringType,
    style: TextStyle.classType,
};
const Data = {
    end_markup: stringType,
    style: Props.style,
};
const PropsType: RecordType<EndMarkupProps> = recordType(Props);
const DataType: RecordType<EndMarkupData> = recordType(Data).withOptional("style");
const propsToData = ({tag, style}: EndMarkupProps): EndMarkupData => (
    style.isEmpty ? {end_markup: tag} : {end_markup: tag, style}
);

/**
 * The base record class for {@link EndMarkup}
 * @public
 */
export const EndMarkupBase = RecordClass(PropsType, InlineNode, DataType, propsToData);

/**
 * Properties of {@link EndMarkup}
 * @public
 */
export interface EndMarkupProps {
    tag: string;
    style: TextStyle;
}

/**
 * Data of {@link EndMarkup}
 * @public
 */
export interface EndMarkupData {
    end_markup: string;
    style?: TextStyle;
}

/**
 * Represents a line break.
 * @public
 * @sealed
 */
@frozen
@validating
@FlowNodeRegistry.register
export class EndMarkup extends EndMarkupBase implements EndMarkupProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => EndMarkup);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: EndMarkupData): EndMarkup {
        const { end_markup: tag, style = TextStyle.empty} = data;
        const props: EndMarkupProps = { tag, style };
        return new EndMarkup(props);
    }

    constructor(props: EndMarkupProps) {
        super(props);
    }
}
