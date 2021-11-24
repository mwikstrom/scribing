import { RecordType, recordType, stringType, unionType, nullType, arrayType } from "paratype";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowPresence, FlowPresenceType } from "./FlowPresence";

/** @public */
export interface FlowSyncOutput {
    token: string;
    merge: FlowOperation | null;
    presence: FlowPresence[];
}

/** @public */
export const FlowSyncOutputType: RecordType<FlowSyncOutput> = recordType({
    token: stringType,
    merge: unionType(FlowOperation.baseType, nullType),
    presence: arrayType(FlowPresenceType),
});
