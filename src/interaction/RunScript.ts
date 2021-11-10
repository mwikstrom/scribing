import { 
    frozen, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    stringType, 
    validating 
} from "paratype";
import { Interaction } from "./Interaction";
import { InteractionRegistry } from "../internal/class-registry";

const Props = { script: stringType };
const PropsType: RecordType<RunScriptProps> = recordType(Props);

/**
 * The base record class for {@link RunScript}
 * @public
 */
export const RunScriptBase = RecordClass(PropsType, Interaction);

/**
 * Properties for {@link RunScript}
 * @public
 */
export interface RunScriptProps {
    /** The script code that shall be executed */
    script: string;
}

/**
 * An interaction that runs a script
 * @sealed
 * @public
 */
@frozen
@validating
@InteractionRegistry.register
export class RunScript extends RunScriptBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => RunScript);
}
