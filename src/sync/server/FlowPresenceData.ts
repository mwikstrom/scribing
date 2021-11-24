import { arrayType, nonNegativeIntegerType, recordType, RecordType } from "paratype";
import { FlowPresence, FlowPresenceType } from "../FlowPresence";

/** @internal */
export interface FlowPresenceData {
    version: number;
    present: FlowPresence[];
}

/** @internal */
export const FlowPresenceDataType: RecordType<FlowPresenceData> = recordType({
    version: nonNegativeIntegerType,
    present: arrayType(FlowPresenceType),
});
