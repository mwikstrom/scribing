import { 
    RecordType, 
    recordType, 
    unionType, 
    nullType, 
    arrayType, 
    nonNegativeIntegerType, 
    stringType, 
    booleanType 
} from "paratype";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowPresence, FlowPresenceType } from "./FlowPresence";

/** @public */
export interface FlowSyncOutput {
    version: number;
    digest: string;
    merge: FlowOperation | null;
    presence: FlowPresence[];
    frozen: boolean;
}

/** @public */
export const FlowSyncOutputType: RecordType<FlowSyncOutput> = recordType({
    version: nonNegativeIntegerType,
    digest: stringType,
    merge: unionType(FlowOperation.baseType, nullType),
    presence: arrayType(FlowPresenceType),
    frozen: booleanType,
});
