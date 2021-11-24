import { arrayType, RecordType, recordType, stringType } from "paratype";
import { FlowContent } from "../structure/FlowContent";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowPresence, FlowPresenceType } from "./FlowPresence";

/** @public */
export interface FlowSyncSnapshot {
    token: string;
    content: FlowContent;
    theme: FlowTheme;
    presence: FlowPresence[];
}

/** @public */
export const FlowSyncSnapshotType: RecordType<FlowSyncSnapshot> = recordType({
    token: stringType,
    content: FlowContent.classType,
    theme: FlowTheme.baseType,
    presence: arrayType(FlowPresenceType),
});
