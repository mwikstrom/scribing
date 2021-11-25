import { nonNegativeIntegerType, nullType, recordType, RecordType, stringType, unionType } from "paratype";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection } from "../selection/FlowSelection";

/** @public */
export interface FlowSyncInput {
    key: string;
    version: number;
    selection: FlowSelection | null;
    operation: FlowOperation | null;
}

/** @public */
export const FlowSyncInputType: RecordType<FlowSyncInput> = recordType({
    key: stringType,
    version: nonNegativeIntegerType,
    operation: unionType(FlowOperation.baseType, nullType),
    selection: unionType(FlowSelection.baseType, nullType),
});
