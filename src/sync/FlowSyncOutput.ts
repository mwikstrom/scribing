import { RecordType, recordType, unionType, nullType, arrayType, nonNegativeIntegerType, stringType } from "paratype";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowPresence, FlowPresenceType } from "./FlowPresence";

/** @public */
export interface FlowSyncOutput {
    version: number;
    digest: string;
    merge: FlowOperation | null;
    presence: FlowPresence[];
}

/** @public */
export const FlowSyncOutputType: RecordType<FlowSyncOutput> = recordType({
    version: nonNegativeIntegerType,
    digest: stringType,
    merge: unionType(FlowOperation.baseType, nullType),
    presence: arrayType(FlowPresenceType),
});
