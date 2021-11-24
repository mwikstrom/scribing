import { nonNegativeIntegerType, nullType, recordType, RecordType, unionType } from "paratype";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection } from "../selection/FlowSelection";

/** @public */
export interface FlowSyncInput {
    version: number;
    operation: FlowOperation | null;
    selection: FlowSelection | null;
}

/** @public */
export const FlowSyncInputType: RecordType<FlowSyncInput> = recordType({
    version: nonNegativeIntegerType,
    operation: unionType(FlowOperation.baseType, nullType),
    selection: unionType(FlowSelection.baseType, nullType),
});
