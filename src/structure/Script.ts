import { mapType, RecordClass, recordClassType, recordType, RecordType, stringType, Type, unionType } from "paratype";
import { isSupportedMessageFormat } from "../internal/message-format";

const Props = {
    code: stringType,
    messages: mapType(stringType).frozen(),
};

const PropsType: RecordType<ScriptProps> = recordType(Props);
const DataType: Type<ScriptData> = unionType(Props.code, PropsType);
const propsToData = (props: ScriptProps): ScriptData => (
    props.messages.size === 0 ? props.code : props
);

/**
 * Properties of a script
 * @public
 */
export interface ScriptProps {
    /** Script code */
    code: string;
    
    /** Localization messages */
    messages: Map<string, string>;
}

/**
 * Data contract for a script
 * @public
 */
export type ScriptData = string | ScriptProps;

/**
 * The base record class for {@link Script}
 * @public
 */
export const ScriptBase = RecordClass(PropsType, Object, DataType, propsToData);

/**
 * A script
 * @public
 */
export class Script extends ScriptBase implements Readonly<ScriptProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => Script);

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: ScriptData): Script {
        let code: string;
        let messages: Map<string, string>;
        if (typeof data === "string") {
            code = data;
            messages = EMPTY_MESSAGES;
        } else {
            code = data.code;
            if (Object.isFrozen(data.messages)) {
                messages = data.messages;
            } else {
                messages = new Map(data.messages);
                Object.freeze(messages);
            }
        }
        return new Script({code, messages});
    }

    /** Determines whether the specified message format is supported */
    public static isSupportedMessageFormat(message: string): boolean {
        return isSupportedMessageFormat(message);
    }

    /** Escapes the specified message format */
    public static escapeMessage(message: string): string {
        return message.replace(/[#{}]|(?:'[#{}]')/g, "'$&'");
    }
}

const EMPTY_MESSAGES: Map<string, string> = Object.freeze(new Map());
