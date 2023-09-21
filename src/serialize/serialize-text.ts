import { FlowContent } from "../structure/FlowContent";
import { TextSerializer } from "./TextSerializer";

/** @public */
export interface FlowContentTextOptions {
    endOfLine: string;
    dynamicTextReplacement: string;
}

/**
 * Serializes the specified flow content to plain text
 * @param content - The flow content that shall be serialized
 * @param options - Optional. Options for controlling text serialization.
 * @returns The serialized plain text string
 * @public
 */
export function serializeFlowContentToText(
    content: FlowContent,
    options?: Partial<FlowContentTextOptions>
): string {
    const serializer = new TextSerializer(applyDefaults(options));
    serializer.visitFlowContent(content);
    return serializer.getResult();
}

const applyDefaults = (input: Partial<FlowContentTextOptions> = {}): FlowContentTextOptions => {
    const {
        endOfLine = "\n",
        dynamicTextReplacement = "…",
    } = input;
    const output: FlowContentTextOptions = { endOfLine, dynamicTextReplacement };
    return output;
};
