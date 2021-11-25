import { BlobStore } from "../BlobStore";
import { FlowChange } from "../FlowChange";
import { FlowHeadData } from "../FlowHeadData";
import { ServerLogger } from "../ServerLogger";
import { storeHistory } from "./history";
import { ABORT_SYMBOL } from "./retry";
import { getAge, ONE_MINUTE } from "./time";

/** @internal */
export const getTrimmedHead = async (
    logger: ServerLogger,
    blobStore: BlobStore,
    dataBefore: FlowHeadData,
): Promise<FlowHeadData | typeof ABORT_SYMBOL> => {
    const { recent, ...rest } = dataBefore;
    const trimCount = getTrimCount(recent);
    const keepCount = recent.length - trimCount;
    const trimmedRecent = keepCount > 0 ? recent.slice(-keepCount) : [];
    const success = await storeHistory(logger, blobStore, rest.version, recent.slice(0, trimCount));
    if (!success) {
        return ABORT_SYMBOL;
    }
    const dataAfter: FlowHeadData= { ...rest, recent: trimmedRecent };
    return dataAfter;
};

/** @internal */
export const shouldTrim = (recent: readonly FlowChange[]): boolean => getTrimCount(recent) > 0;

const getTrimCount = (recent: readonly FlowChange[]): number => {
    let count = 0;
    
    for (const change of recent) {
        if (getAge(change.at) > KEEP_RECENT_AGE) {
            ++count;
        } else {
            break;
        }
    }

    return Math.max(count, recent.length - MAX_RECENT_COUNT);
};

const KEEP_RECENT_AGE = 5 * ONE_MINUTE;
const MAX_RECENT_COUNT = 1000;
