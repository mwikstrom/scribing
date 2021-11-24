import { FlowSelection } from "../selection/FlowSelection";

/** @public */
export interface FlowPresence {
    key: string;
    uid: string;
    name: string;
    selection: FlowSelection | null;
}