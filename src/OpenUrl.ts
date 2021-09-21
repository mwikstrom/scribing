import { 
    frozen, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    stringType, 
    Type, 
    validating 
} from "paratype";
import { Interaction } from "./Interaction";
import { InteractionRegistry } from "./internal/class-registry";

const urlType = stringType.restrict(
    "Must be an absolute https URL",
    value => {
        if (!/^https:\/\//.test(value)) {
            return false;
        }

        try {
            new URL(value);
            return true;
        } catch (err) {
            return false;
        }
    }
);
const Props = { url: urlType };
const PropsType: RecordType<OpenUrlProps> = recordType(Props);
const DataType: Type<string> = urlType;
const propsToData = ({url}: OpenUrlProps) => url;

/**
 * The base record class for {@link OpenUrl}
 * @public
 */
export const OpenUrlBase = RecordClass(PropsType, Interaction, DataType, propsToData);

/**
 * Properties for {@link OpenUrl}
 * @public
 */
export interface OpenUrlProps {
    /** The URL that shall be opened */
    url: string;
}

/**
 * An interaction that opens a URL
 * @sealed
 * @public
 */
@frozen
@validating
@InteractionRegistry.register
export class OpenUrl extends OpenUrlBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => OpenUrl);

    /** Gets an instance of the current class from the specified data */
    public static fromData(data: string): OpenUrl {
        return new OpenUrl({url: data});
    }
}
