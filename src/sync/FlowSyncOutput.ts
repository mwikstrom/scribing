import { RecordType, recordType, unionType, nullType, arrayType, nonNegativeIntegerType } from "paratype";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowPresence, FlowPresenceType } from "./FlowPresence";

/** @public */
export interface FlowSyncOutput {
    version: number;
    merge: FlowOperation | null;
    presence: FlowPresence[];
}

/** @public */
export const FlowSyncOutputType: RecordType<FlowSyncOutput> = recordType({
    version: nonNegativeIntegerType,
    merge: unionType(FlowOperation.baseType, nullType),
    presence: arrayType(FlowPresenceType),
});
