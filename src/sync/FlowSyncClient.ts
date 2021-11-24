import { FlowSyncSnapshot, FlowSyncSnapshotType } from "./FlowSyncSnapshot";
import { FlowSyncProtocol } from "./FlowSyncProtocol";
import { FlowSyncInput } from "./FlowSyncInput";
import { FlowSyncOutput, FlowSyncOutputType } from "./FlowSyncOutput";
import { JsonValue } from "paratype";
import { FlowSyncInputType } from "..";

/** @public */
export class FlowSyncClient implements FlowSyncProtocol {
    readonly #url: string;
    readonly #fetch: typeof fetch;

    constructor(url: string, fetcher = fetch) {
        this.#url = url;
        this.#fetch = fetcher;
    }

    get url(): string {
        return this.#url;
    }

    async read(): Promise<FlowSyncSnapshot> {
        const response = ensureSuccess(await this.#fetch(this.#url));
        const json = await response.json() as JsonValue;
        return FlowSyncSnapshotType.fromJsonValue(json);
    }

    async sync(input: FlowSyncInput): Promise<FlowSyncOutput> {
        const response = ensureSuccess(await this.#fetch(this.#url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(FlowSyncInputType.toJsonValue(input)),
        }));
        const json = await response.json() as JsonValue;
        return FlowSyncOutputType.fromJsonValue(json);
    }
}

const ensureSuccess = (response: Response): Response => {
    if (response.ok) {
        return response;
    } else {
        throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
    }
};
