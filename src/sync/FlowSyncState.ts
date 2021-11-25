import { FlowOperation } from "../operations/FlowOperation";
import { FlowContent } from "../structure/FlowContent";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowPresence } from "./FlowPresence";

/** @public */
export interface FlowSyncState {
    content: FlowContent;
    theme: FlowTheme;
    presence: readonly FlowPresence[];
    undoStack: readonly FlowOperation[];
    redoStack: readonly FlowOperation[];
    uid: string;
    name: string;
    connected: boolean;
    dirty: boolean;
    busy: boolean;
    broken: boolean;
    autoSync: boolean;
}
