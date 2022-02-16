import { 
    isArgumentElement, 
    isLiteralElement, 
    isPluralElement, 
    isPoundElement, 
    isSelectElement, 
    MessageFormatElement, 
    PluralOrSelectOption, 
} from "@formatjs/icu-messageformat-parser";
import type { Element as XmlElem } from "xml-js";
import { isSupportedPluralCaseKey, parseMessageFormat } from "./message-format";

export const serializeMessage = (key: string, message: string): XmlElem => {
    return {
        type: "element",
        name: "message",
        attributes: { key },
        elements: serializeMessageBody(message),
    };
};

const serializeMessageBody = (message: string): XmlElem[] => {
    try {
        const elems = parseMessageFormat(message);
        return elems.map(serializeMessageFormatElement);    
    } catch {
        return [{
            type: "element",
            name: "c",
            elements: [{ type: "text", text: message }],
        }];
    }
};

const serializeMessageFormatElement = (elem: MessageFormatElement): XmlElem => {
    if (isLiteralElement(elem)) {
        const { value } = elem;
        return {
            type: "element",
            name: "t",
            elements: [{ type: "text", text: value }],
        };        
    } else if (isPoundElement(elem)) {
        return { type: "element", name: "count" };
    } else if (isArgumentElement(elem)) {
        const { value } = elem;
        return {
            type: "element",
            name: "value",
            attributes: {
                var: value,
            },
        };
    } else if (isPluralElement(elem)) {
        const { value, options, offset, pluralType } = elem;
        return {
            type: "element",
            name: "plural",
            attributes: {
                var: value,
                mode: pluralType,
                offset: offset !== 0 ? offset : undefined,
            },
            elements: Object.entries(options).map(([key, value]) => serializePluralOption(key, value)),
        };
    } else if (isSelectElement(elem)) {
        const { value, options } = elem;
        return {
            type: "element",
            name: "choose",
            attributes: { var: value },
            elements: Object.entries(options).map(([key, value]) => serializeSelectOption(key, value)),
        };
    } else {
        // Note: Formatting functions are currently not supported
        throw new TypeError(`Unsupported message format element: ${JSON.stringify(elem)}`);
    }
};

const serializePluralOption = (key: string, option: PluralOrSelectOption): XmlElem => {
    const { value } = option;
    
    if (!isSupportedPluralCaseKey(key)) {
        throw new TypeError(`Unsupported plural case: ${key}`);
    }

    if (/^=\d+/.test(key)) {
        return {
            type: "element",
            name: "exact",
            attributes: { eq: key.substring(1) },
            elements: value.map(serializeMessageFormatElement),
        };
    } else {
        return {
            type: "element",
            name: key,
            elements: value.map(serializeMessageFormatElement),
        };
    }
};

const serializeSelectOption = (key: string, option: PluralOrSelectOption): XmlElem => {
    const { value } = option;
    if (key === "other") {
        return {
            type: "element",
            name: "other",
            elements: value.map(serializeMessageFormatElement),
        };
    } else {
        return {
            type: "element",
            name: "when",
            attributes: { eq: key },
            elements: value.map(serializeMessageFormatElement),
        };
    }
};
