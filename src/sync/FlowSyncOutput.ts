import { FlowOperation } from "../operations/FlowOperation";
import { FlowPresence } from "./FlowPresence";

/** @public */
export interface FlowSyncOutput {
    token: string;
    merge?: FlowOperation;
    presence: readonly FlowPresence[];
}