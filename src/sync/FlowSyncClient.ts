import { nanoid } from "nanoid";
import { FlowSyncProtocol, HttpFlowSyncProtocol } from "./FlowSyncProtocol";

/** @public */
export class FlowSyncClient {
    readonly #protocol: FlowSyncProtocol;
    readonly #key: string;

    constructor(url: string, key?: string);
    constructor(protocol: FlowSyncProtocol, key?: string);
    constructor(protocol: FlowSyncProtocol | string, key = getStaticKey()) {
        this.#protocol = typeof protocol === "string" ? new HttpFlowSyncProtocol(protocol) : protocol;
        this.#key = key;
    }

    public get key(): string {
        return this.#key;
    }
}

let STATIC_KEY: string | undefined;
const getStaticKey = () => {
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
