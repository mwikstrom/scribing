import { nullType, RecordType, recordType, stringType, unionType } from "paratype";
import { FlowSelection } from "../selection/FlowSelection";

/** @public */
export interface FlowPresence {
    key: string;
    uid: string;
    name: string;
    selection: FlowSelection | null;
}

/** @public */
export const FlowPresenceType: RecordType<FlowPresence> = recordType({
    key: stringType,
    uid: stringType,
    name: stringType,
    selection: unionType(FlowSelection.baseType, nullType),
});
