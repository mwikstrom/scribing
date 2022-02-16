import type { Element as XmlElem } from "xml-js";
import { parse as parseMessage } from "@messageformat/parser";
import type {
    Select as MsgFormatSelect,
    SelectCase,
} from "@messageformat/parser";
import { 
    isArgumentToken, 
    isContentToken, 
    isOctothorpe, 
    isPluralToken, 
    isSelectOrdinalToken, 
    isSelectToken, 
    isSupportedPluralCaseKey, 
    MessageToken
} from "../internal/message-format";

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
        const tokens = parseMessage(message, { strict: true });
        return tokens.map(serializeMessageToken);    
    } catch {
        return [{
            type: "element",
            name: "c",
            elements: [{ type: "text", text: message }],
        }];
    }
};

const serializeMessageToken = (token: MessageToken): XmlElem => {
    if (isContentToken(token)) {
        const { value } = token;
        return {
            type: "element",
            name: "t",
            elements: [{ type: "text", text: value }],
        };
    } else if (isOctothorpe(token)) {
        return { type: "element", name: "count" };
    } else if (isArgumentToken(token)) {
        const { arg } = token;
        return {
            type: "element",
            name: "value",
            attributes: {
                var: arg,
            },
        };
    } else if (isPluralToken(token)) {
        return serializePlural(token, "cardinal");
    } else if (isSelectOrdinalToken(token)) {
        return serializePlural(token, "ordinal");
    } else if (isSelectToken(token)) {
        const { arg, cases } = token;
        return {
            type: "element",
            name: "choose",
            attributes: { var: arg },
            elements: cases.map(serializeSelectCase),
        };
    } else {
        // Note: Formatting functions are currently not supported
        throw new TypeError(`Unsupported message format token: ${JSON.stringify(token)}`);
    }
};

const serializePlural = (token: MsgFormatSelect, mode: "ordinal" | "cardinal"): XmlElem => {
    const { arg, cases, pluralOffset: offset } = token;
    return {
        type: "element",
        name: "plural",
        attributes: {
            var: arg,
            mode,
            offset,
        },
        elements: cases.map(serializePluralCase),
    };        
};

const serializePluralCase = (input: SelectCase): XmlElem => {
    const { key, tokens } = input;
    if (!isSupportedPluralCaseKey(key)) {
        throw new TypeError(`Unsupported plural case: ${JSON.stringify(input)}`);
    }
    if (/^=\d+/.test(key)) {
        return {
            type: "element",
            name: "exact",
            attributes: { eq: key.substring(1) },
            elements: tokens.map(serializeMessageToken),
        };
    } else {
        return {
            type: "element",
            name: key,
            elements: tokens.map(serializeMessageToken),
        };
    }
};

const serializeSelectCase = (input: SelectCase): XmlElem => {
    const { key, tokens } = input;
    if (key === "other") {
        return {
            type: "element",
            name: "other",
            elements: tokens.map(serializeMessageToken),
        };
    } else {
        return {
            type: "element",
            name: "when",
            attributes: { eq: key },
            elements: tokens.map(serializeMessageToken),
        };
    }
};
