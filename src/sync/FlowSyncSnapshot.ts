import { arrayType, nonNegativeIntegerType, RecordType, recordType } from "paratype";
import { FlowContent } from "../structure/FlowContent";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowPresence, FlowPresenceType } from "./FlowPresence";

/** @public */
export interface FlowSyncSnapshot {
    version: number;
    content: FlowContent;
    theme: FlowTheme;
    presence: FlowPresence[];
}

/** @public */
export const FlowSyncSnapshotType: RecordType<FlowSyncSnapshot> = recordType({
    version: nonNegativeIntegerType,
    content: FlowContent.classType,
    theme: FlowTheme.baseType,
    presence: arrayType(FlowPresenceType),
});
