import { FlowSyncSnapshot } from "./FlowSyncSnapshot";
import { FlowSyncProtocol } from "./FlowSyncProtocol";
import { FlowSyncInput } from "./FlowSyncInput";
import { FlowSyncOutput } from "./FlowSyncOutput";

/** @public */
export class FlowSyncClient implements FlowSyncProtocol {
    read(): Promise<FlowSyncSnapshot> {
        throw new Error("Method not implemented.");
    }
    sync(input: FlowSyncInput): Promise<FlowSyncOutput> {
        throw new Error("Method not implemented.");
    }
}