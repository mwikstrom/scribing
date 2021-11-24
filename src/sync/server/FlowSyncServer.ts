import { FlowSyncSnapshot } from "../FlowSyncSnapshot";
import { FlowSyncInput } from "../FlowSyncInput";
import { FlowSyncOutput } from "../FlowSyncOutput";
import { BlobReadResult, BlobStore } from "./BlobStore";
import { ServerSession } from "./ServerSession";
import { FlowContentDataType } from "./FlowContentData";
import { JsonValue } from "paratype";
import { FlowChange } from "./FlowChange";
import { FlowPresence } from "../FlowPresence";

/** @public */
export class FlowSyncServer {
    #store: BlobStore;

    constructor(store: BlobStore) {
        this.#store = store;
    }

    clean(): Promise<void> {
        // TODO: IMPLEMENT CLEAN
        throw new Error("Method not implemented.");
    }

    async read(session: ServerSession): Promise<FlowSyncSnapshot | null> {
        const [contentResult, presenceResult] = await Promise.all([
            this.#store.read(CONTENT_BLOB_KEY),
            this.#store.read(PRESENCE_BLOB_KEY),
        ]);
        
        if (contentResult === null) {
            return null;
        }

        const { version, content, theme, recent } = await getContentData(contentResult);
        const presence = await getPresenceData(presenceResult, version, recent, session);
                        
        return { version, content, theme, presence };
    }
    
    sync(input: FlowSyncInput, session: ServerSession): Promise<FlowSyncOutput | null> {
        // TODO: IMPLEMENT SYNC
        throw new Error("Method not implemented.");
    }
}

const CONTENT_BLOB_KEY = "content";
const PRESENCE_BLOB_KEY = "presence";

const getContentData = async (readResult: BlobReadResult) => {
    const contentText = await readResult.blob.text();
    const contentJson = JSON.parse(contentText) as JsonValue;
    return FlowContentDataType.fromJsonValue(contentJson);
};

const getPresenceData = (
    readResult: BlobReadResult | null,
    contentVersion: number,
    recentChanges: FlowChange[],
    currentSession: ServerSession
): Promise<FlowPresence[]> => {
    throw new Error("Method not implemented.");
};
