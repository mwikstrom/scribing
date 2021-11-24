import { FlowSyncSnapshot } from "./FlowSyncSnapshot";
import { FlowSyncInput } from "./FlowSyncInput";
import { FlowSyncOutput } from "./FlowSyncOutput";

/** @public */
export interface FlowSyncProtocol {
    read(): Promise<FlowSyncSnapshot>;
    sync(input: FlowSyncInput): Promise<FlowSyncOutput>;
}
