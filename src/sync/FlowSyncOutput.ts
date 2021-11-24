import { FlowOperation } from "../operations/FlowOperation";
import { FlowPresence } from "./FlowPresence";

/** @public */
export interface FlowSyncOutput {
    token: string;
    merge: readonly FlowOperation[];
    presence: readonly FlowPresence[];
}