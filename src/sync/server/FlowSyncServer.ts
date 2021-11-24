import { FlowSyncSnapshot } from "../FlowSyncSnapshot";
import { FlowSyncInput } from "../FlowSyncInput";
import { FlowSyncOutput } from "../FlowSyncOutput";
import { BlobConditions, BlobReadResult, BlobStore } from "./BlobStore";
import { ServerSession } from "./ServerSession";
import { FlowHeadData, FlowHeadDataType } from "./FlowHeadData";
import { JsonValue } from "paratype";
import { FlowChange } from "./FlowChange";
import { FlowPresence } from "../FlowPresence";
import { FlowOperation } from "../../operations/FlowOperation";
import { FlowBatch } from "../../operations/FlowBatch";
import { DefaultFlowTheme } from "../../styles/DefaultFlowTheme";
import { FlowContent } from "../../structure/FlowContent";
import { FlowSelection } from "../../selection/FlowSelection";

/** @public */
export class FlowSyncServer {
    #blobStore: BlobStore;

    constructor(blobStore: BlobStore) {
        this.#blobStore = blobStore;
    }

    clean(): Promise<void> {
        // TODO: IMPLEMENT CLEAN
        throw new Error("Method not implemented.");
    }

    async read(): Promise<FlowSyncSnapshot> {
        const readResult = await this.#blobStore.read(HEAD_BLOB_KEY);
        return await getHeadData(readResult);
    }
    
    async sync(input: FlowSyncInput, session: ServerSession): Promise<FlowSyncOutput | null> {
        for (let attempt = 1; attempt <= 10; ++attempt) {
            if (attempt > 2) {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
            }

            const readResult = await this.#blobStore.read(HEAD_BLOB_KEY);
            const dataBefore = await getHeadData(readResult);
            const merge = getMergeOperation(input, dataBefore);

            if (merge === CONFLICT_SYMBOL) {
                return null;
            }

            const operation = getOperationToApply(input.operation, merge);
            const recent = getSyncedRecent(dataBefore.recent, session, operation);
            const content = getSyncedContent(dataBefore.content, operation);
            const selection = getSyncedSelection(input.selection, merge, operation);
            const presence = getSyncedPresence(dataBefore.presence, session, selection);
            const dataAfter: FlowHeadData = {
                version: dataBefore.version + 1,
                content,
                theme: dataBefore.theme,
                recent,
                presence,
            };
            
            const newBlob = getHeadBlob(dataAfter);
            const writeCondition = getWriteCondition(readResult);
            const writeResult = await this.#blobStore.write(HEAD_BLOB_KEY, newBlob, writeCondition);
            
            if (writeResult === null) {
                continue;
            }

            const output: FlowSyncOutput = {
                version: dataAfter.version,
                merge,
                presence,
                you: session.key,
            };

            return output;
        }

        throw new Error("Server ran out of attempts when trying to sync");
    }
}

const getHeadData = async (readResult: BlobReadResult | null): Promise<FlowHeadData> => {
    if (readResult === null) {
        return INITIAL_HEAD_DATA;
    } else {
        const text = await readResult.blob.text();
        const json = JSON.parse(text) as JsonValue;
        return FlowHeadDataType.fromJsonValue(json);
    }
};

const getHeadBlob = (data: FlowHeadData): Blob => {
    const json = FlowHeadDataType.toJsonValue(data);
    const text = JSON.stringify(json);
    return new Blob([text], { type: "application/json" });
};

const getWriteCondition = (readResult: BlobReadResult | null): BlobConditions => {
    if (readResult === null) {
        return { ifNoneMatch: "*" };
    } else {
        return { ifMatch: readResult.etag };
    }
};

const getMergeOperation = (
    input: FlowSyncInput,
    data: FlowHeadData
): FlowOperation | null | typeof CONFLICT_SYMBOL => {
    const behind = data.version - input.version;
    if (behind < 0 || behind > data.recent.length) {
        return CONFLICT_SYMBOL;
    } else if (behind === 0) {
        return null;
    } else {
        return FlowBatch.fromArray(data.recent.map(change => change.op).slice(-behind));
    }    
};

const getOperationToApply = (
    given: FlowOperation | null,
    merge: FlowOperation | null,
): FlowOperation | null => {
    if (given === null || merge === null) {
        return given;
    } else {
        return merge.transform(given);
    }
};

const getSyncedSelection = (
    before: FlowSelection | null,
    merge: FlowOperation | null,
    operation: FlowOperation | null,
): FlowSelection | null => {
    let synced = before;
    
    if (synced !== null && merge !== null) {
        synced = merge.applyToSelection(synced, false);
    }

    if (synced !== null && operation !== null) {
        synced = operation.applyToSelection(synced, true);
    }

    return synced;
};

const getSyncedRecent = (
    before: readonly FlowChange[],    
    session: ServerSession,
    operation: FlowOperation | null,
): FlowChange[] => {
    if (operation === null) {
        return [...before];
    } else {
        return [...before, {
            at: new Date(),
            by: session,
            op: operation,
        }];
    }
};

const getSyncedContent = (
    before: FlowContent,
    operation: FlowOperation | null,
): FlowContent => {
    if (operation === null) {
        return before;
    } else {
        return operation.applyToContent(before);
    }
};

const getSyncedPresence = (
    before: readonly FlowPresence[],
    session: ServerSession,
    selection: FlowSelection | null,
): FlowPresence[] => [
    ...before.filter(presence => presence.key !== session.key && getAge(presence.seen) <= MAX_PRESENCE_AGE),
    {
        key: session.key,
        uid: session.uid,
        seen: new Date(),
        name: session.name,
        selection,
    }
];

const getAge = (value: Date): number => Date.now() - value.getTime();

const CONFLICT_SYMBOL: unique symbol = Symbol("Conflict");

const HEAD_BLOB_KEY = "head";

const INITIAL_HEAD_DATA: FlowHeadData = Object.freeze({
    version: 0,
    content: FlowContent.empty,
    theme: DefaultFlowTheme.instance,
    recent: Object.freeze(new Array<FlowChange>(0)) as FlowChange[],
    presence: Object.freeze(new Array<FlowPresence>(0)) as FlowPresence[],
});

const MAX_PRESENCE_AGE = 10000; // 10 seconds