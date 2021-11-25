import { nullType, RecordType, recordType, stringType, timestampType, unionType } from "paratype";
import { FlowSelection } from "../selection/FlowSelection";

/** @public */
export interface FlowPresence {
    client: string;
    user: string;
    seen: Date;
    selection: FlowSelection | null;
}

/** @public */
export const FlowPresenceType: RecordType<FlowPresence> = recordType({
    client: stringType,
    user: stringType,
    seen: timestampType,
    selection: unionType(FlowSelection.baseType, nullType),
});
