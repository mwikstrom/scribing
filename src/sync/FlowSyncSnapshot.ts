import { FlowContent } from "../structure/FlowContent";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowPresence } from "./FlowPresence";

/** @public */
export interface FlowSyncSnapshot {
    token: string;
    content: FlowContent;
    theme: FlowTheme;
    presence: readonly FlowPresence[];
}