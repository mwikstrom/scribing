import { 
    frozen, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    validating 
} from "paratype";
import { Interaction } from "./Interaction";
import { InteractionRegistry } from "../internal/class-registry";
import { Script } from "../script";

const Props = { script: Script.classType };
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
    script: Script;
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
