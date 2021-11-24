import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection } from "../selection/FlowSelection";

/** @public */
export interface FlowSyncInput {
    token: string;
    operation?: FlowOperation | null;
    selection?: FlowSelection | null;
}