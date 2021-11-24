import { arrayType, nonNegativeIntegerType, recordType, RecordType } from "paratype";
import { FlowContent } from "../../structure/FlowContent";
import { FlowTheme } from "../../styles/FlowTheme";
import { FlowChange, FlowChangeType } from "./FlowChange";

/** @internal */
export interface FlowContentData {
    version: number;
    content: FlowContent;
    theme: FlowTheme;
    recent: FlowChange[];
}

/** @internal */
export const FlowContentDataType: RecordType<FlowContentData> = recordType({
    version: nonNegativeIntegerType,
    content: FlowContent.classType,
    theme: FlowTheme.baseType,
    recent: arrayType(FlowChangeType),
});