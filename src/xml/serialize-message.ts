import type { Element as XmlElem } from "xml-js";
import { parse as parseMessage } from "@messageformat/parser";
import type {
    Content as MsgFormatContent,
    PlainArg as MsgFormatPlainArg,
    FunctionArg as MsgFormatFunctionArg,
    Select as MsgFormatSelect,
    Octothorpe,
    SelectCase,
} from "@messageformat/parser";

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

type MessageToken = MsgFormatContent | MsgFormatPlainArg | MsgFormatFunctionArg | MsgFormatSelect | Octothorpe;
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

function isContentToken(token: MessageToken): token is MsgFormatContent {
    return token.type === "content";
}

function isOctothorpe(token: MessageToken): token is Octothorpe {
    return token.type === "octothorpe";
}

function isArgumentToken(token: MessageToken): token is MsgFormatPlainArg {
    return token.type === "argument";
}

function isPluralToken(token: MessageToken): token is MsgFormatSelect & { type: "plural" } {
    return token.type === "plural";
}

function isSelectOrdinalToken(token: MessageToken): token is MsgFormatSelect & { type: "selectordinal" } {
    return token.type === "selectordinal";
}

function isSelectToken(token: MessageToken): token is MsgFormatSelect & { type: "select" } {
    return token.type === "select";
}

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
    if (["zero", "one", "two", "few", "many", "other"].includes(key)) {
        return {
            type: "element",
            name: key,
            elements: tokens.map(serializeMessageToken),
        };
    } else {
        return {
            type: "element",
            name: "exact",
            attributes: { eq: key.replace(/^=/, "") },
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
