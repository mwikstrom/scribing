import { booleanType, nonNegativeIntegerType, nullType, recordType, RecordType, stringType, unionType } from "paratype";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection } from "../selection/FlowSelection";

/** @public */
export interface FlowSyncInput {
    client: string;
    version: number;
    selection: FlowSelection | null;
    operation: FlowOperation | null;
    frozen?: boolean;
}

/** @public */
export const FlowSyncInputType: RecordType<FlowSyncInput> = recordType({
    client: stringType,
    version: nonNegativeIntegerType,
    operation: unionType(FlowOperation.baseType, nullType),
    selection: unionType(FlowSelection.baseType, nullType),
    frozen: booleanType,
}).withOptional("frozen");
