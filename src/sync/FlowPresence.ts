import { nullType, RecordType, recordType, stringType, timestampType, unionType } from "paratype";
import { FlowSelection } from "../selection/FlowSelection";

/** @public */
export interface FlowPresence {
    key: string;
    uid: string;
    name: string;
    seen: Date;
    selection: FlowSelection | null;
}

/** @public */
export const FlowPresenceType: RecordType<FlowPresence> = recordType({
    key: stringType,
    uid: stringType,
    name: stringType,
    seen: timestampType,
    selection: unionType(FlowSelection.baseType, nullType),
});
