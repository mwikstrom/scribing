import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection } from "../selection/FlowSelection";

/** @public */
export interface FlowSyncInput {
    token: string;
    changes: readonly FlowOperation[];
    selection: FlowSelection | null;
}