import { arrayType, booleanType, nonNegativeIntegerType, RecordType, recordType, stringType } from "paratype";
import { FlowContent } from "../structure/FlowContent";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowPresence, FlowPresenceType } from "./FlowPresence";

/** @public */
export interface FlowSyncSnapshot {
    version: number;
    content: FlowContent;
    digest: string;
    theme: FlowTheme;
    presence: FlowPresence[];
    frozen: boolean;
}

/** @public */
export const FlowSyncSnapshotType: RecordType<FlowSyncSnapshot> = recordType({
    version: nonNegativeIntegerType,
    content: FlowContent.classType,
    digest: stringType,
    theme: FlowTheme.baseType,
    presence: arrayType(FlowPresenceType),
    frozen: booleanType,
});
