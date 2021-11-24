import { nullType, recordType, RecordType, stringType, unionType } from "paratype";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection } from "../selection/FlowSelection";

/** @public */
export interface FlowSyncInput {
    token: string;
    operation: FlowOperation | null;
    selection: FlowSelection | null;
}

/** @public */
export const FlowSyncInputType: RecordType<FlowSyncInput> = recordType({
    token: stringType,
    operation: unionType(FlowOperation.baseType, nullType),
    selection: unionType(FlowSelection.baseType, nullType),
});
