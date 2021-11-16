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
    start_markup: stringType,
    style: Props.style,
};
const PropsType: RecordType<StartMarkupProps> = recordType(Props);
const DataType: RecordType<StartMarkupData> = recordType(Data).withOptional("style");
const propsToData = ({tag, style}: StartMarkupProps): StartMarkupData => (
    style.isEmpty ? {start_markup: tag} : {start_markup: tag, style}
);

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
}

/**
 * Data of {@link StartMarkup}
 * @public
 */
export interface StartMarkupData {
    start_markup: string;
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
export class StartMarkup extends StartMarkupBase implements StartMarkupProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => StartMarkup);

    /** {@inheritdoc FlowNode.size} */
    public readonly size = 1;

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: StartMarkupData): StartMarkup {
        const { start_markup: tag, style = TextStyle.empty} = data;
        const props: StartMarkupProps = { tag, style };
        return new StartMarkup(props);
    }

    constructor(props: StartMarkupProps) {
        super(props);
    }
}
