import { FlowOperation } from "../../../operations/FlowOperation";
import { FlowSelection } from "../../../selection/FlowSelection";
import { FlowContent } from "../../../structure/FlowContent";
import { FlowSyncInput } from "../../FlowSyncInput";
import { FlowChange } from "../FlowChange";
import { FlowHeadData } from "../FlowHeadData";
import { ServerSession } from "../ServerSession";
import { CONFLICT_SYMBOL, getMergeOperation } from "./merge";
import { getSyncedPresence } from "./sync-presence";

/** @internal */
export interface SyncedHeadResult {
    dataAfter: FlowHeadData,
    merge: FlowOperation | null,
}

/** @internal */
export const getSyncedHead = (
    input: FlowSyncInput,
    session: ServerSession,
    dataBefore: FlowHeadData
): SyncedHeadResult | typeof CONFLICT_SYMBOL => {
    const merge = getMergeOperation(input, dataBefore);

    if (merge === CONFLICT_SYMBOL) {
        return CONFLICT_SYMBOL;
    }

    const operation = getOperationToApply(input.operation, merge);
    const recent = getSyncedRecent(dataBefore.recent, session, operation);
    const content = getSyncedContent(dataBefore.content, operation);
    const selection = getSyncedSelection(input.selection, merge, operation);
    const presence = getSyncedPresence(dataBefore.presence, session, selection, operation);
    const dataAfter: FlowHeadData = {
        version: dataBefore.version + 1,
        content,
        theme: dataBefore.theme,
        recent,
        presence,
    };

    return { dataAfter, merge };
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
