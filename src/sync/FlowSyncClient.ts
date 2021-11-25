import { nanoid } from "nanoid";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowSyncProtocol, HttpFlowSyncProtocol } from "./FlowSyncProtocol";
import { FlowSyncState } from "./FlowSyncState";

/** @public */
export class FlowSyncClient {
    readonly #protocol: FlowSyncProtocol;
    readonly #key: string;

    constructor(url: string, clientKey?: string);
    constructor(protocol: FlowSyncProtocol, key?: string);
    constructor(protocol: FlowSyncProtocol | string, key = getStaticClientKey()) {
        this.#protocol = typeof protocol === "string" ? new HttpFlowSyncProtocol(protocol) : protocol;
        this.#key = key;
    }

    public get state(): FlowSyncState {
        // TODO: IMPLEMENT
        throw new Error("Not implemented");
    }

    public applyChange(operation: FlowOperation): boolean {
        // TODO: IMPLEMENT
        throw new Error("Not implemented");
    }

    public applySelection(selection: FlowSelection | null): boolean {
        // TODO: IMPLEMENT
        throw new Error("Not implemented");
    }

    public disconnect(): boolean {
        // TODO: IMPLEMENT
        throw new Error("Not implemented");
    }

    public enableAutoSync(value: boolean): void {
        // TODO: IMPLEMENT
        throw new Error("Not implemented");
    }

    public observeState(onNext: (state: FlowSyncState) => void): () => void {
        // TODO: IMPLEMENT
        throw new Error("Not implemented");
    }

    public reconnect(): boolean {
        // TODO: IMPLEMENT
        throw new Error("Not implemented");
    }

    public sync(): Promise<boolean> {
        // TODO: IMPLEMENT
        throw new Error("Not implemented");
    }
}

let STATIC_KEY: string | undefined;
const getStaticClientKey = () => {
    if (STATIC_KEY === void(0)) {
        STATIC_KEY = nanoid();
        try {
            const fromStorage = localStorage.getItem(STORAGE_KEY);
            if (fromStorage === null) {
                localStorage.setItem(STORAGE_KEY, STATIC_KEY);
            } else {
                STATIC_KEY = fromStorage;
            }
        } catch (error) {
            console.warn(`Could not read/write local storage key: ${STORAGE_KEY}`, error);
        }
    }
    return STATIC_KEY;
};

const STORAGE_KEY = "Scribing.FlowSyncClient.Key";
