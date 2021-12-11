import { FlowSyncSnapshot, FlowSyncSnapshotType } from "./FlowSyncSnapshot";
import { FlowSyncInput, FlowSyncInputType } from "./FlowSyncInput";
import { FlowSyncOutput, FlowSyncOutputType } from "./FlowSyncOutput";
import { JsonValue } from "paratype";

/** @public */
export interface FlowSyncProtocol {
    read(): Promise<FlowSyncSnapshot | null>;
    sync(input: FlowSyncInput): Promise<FlowSyncOutput | null>;
}

/** @public */
export type BasicFetch = (url: string, init?: BasicRequestInit) => Promise<Response>;

/** @public */
export interface BasicRequestInit {
    method?: string;
    headers?: Record<string, string>;
    body: string;
}

/** @public */
export class HttpFlowSyncProtocol implements FlowSyncProtocol {
    readonly #url: string;
    readonly #fetch: BasicFetch;

    constructor(url: string, fetcher: BasicFetch = (...args) => fetch(...args)) {
        this.#url = url;
        this.#fetch = fetcher;
    }

    get url(): string {
        return this.#url;
    }

    async read(): Promise<FlowSyncSnapshot | null> {
        const response = await this.#fetch(this.#url);
        if (response.ok) {
            const json = await response.json() as JsonValue;
            return FlowSyncSnapshotType.fromJsonValue(json);
        } else if (response.status === 404) {
            return null;
        } else {
            throw makeServerError(response);
        }
    }

    async sync(input: FlowSyncInput): Promise<FlowSyncOutput | null> {
        const response = await this.#fetch(this.#url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(FlowSyncInputType.toJsonValue(input)),
        });
        if (response.ok) {
            const json = await response.json() as JsonValue;
            return FlowSyncOutputType.fromJsonValue(json);
        } else if (response.status === 404 || response.status === 409) {
            return null;
        } else {
            throw makeServerError(response);
        }
    }
}

const makeServerError = (response: Response): Error => new Error(
    `Server responded with http status: ${response.status} ${response.statusText}`
);
