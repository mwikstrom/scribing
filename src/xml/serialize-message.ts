import { Element as XmlElem } from "xml-js";
import {
    parse as parseMessage,
    Content as MsgFormatContent,
    PlainArg as MsgFormatPlainArg,
    FunctionArg as MsgFormatFunctionArg,
    Select as MsgFormatSelect,
    Octothorpe,
    SelectCase,
} from "@messageformat/parser";

export const serializeMessage = (key: string, message: string): XmlElem => {
    return {
        name: "message",
        attributes: { key },
        elements: serializeMessageBody(message),
    };
};

const serializeMessageBody = (message: string): XmlElem[] => {
    try {
        const tokens = parseMessage(message, { strict: true });
        return tokens.map(serializeMessageToken);    
    } catch (error) {
        console.error(`Invalid message format: ${message}`);
        return [{
            name: "c",
            elements: [{ text: message }],
        }];
    }
};

type MessageToken = MsgFormatContent | MsgFormatPlainArg | MsgFormatFunctionArg | MsgFormatSelect | Octothorpe;
const serializeMessageToken = (token: MessageToken): XmlElem => {
    const { type } = token;
    if (type === "content") {
        const { value } = token;
        return {
            name: "t",
            elements: [{ text: value }],
        };
    } else if (type === "octothorpe") {
        return { name: "count" };
    } else if (type === "argument") {
        const { arg } = token;
        return {
            name: "value",
            attributes: {
                var: arg,
            },
        };
    } else if (type === "plural") {
        const { arg, cases, pluralOffset: offset } = token;
        return {
            name: "plural",
            attributes: {
                var: arg,
                mode: "cardinal",
                offset,
            },
            elements: cases.map(serializePluralCase),
        };        
    } else if (type === "selectordinal") {
        const { arg, cases, pluralOffset: offset } = token;
        return {
            name: "plural",
            attributes: {
                var: arg,
                mode: "ordinal",
                offset,
            },
            elements: cases.map(serializePluralCase),
        };        
    } else if (type === "select") {
        const { arg, cases } = token;
        return {
            name: "choose",
            attributes: { var: arg },
            elements: cases.map(serializeSelectCase),
        };
    } else {
        const { ctx: { text }, ...other } = token;
        console.error(`Unsupported message format token: ${JSON.stringify(other)}`);
        return {
            name: "c",
            elements: [{ text }],
        };
    }
};

const serializePluralCase = (input: SelectCase): XmlElem => {
    const { key, tokens } = input;
    if (["zero", "one", "two", "few", "many", "other"].includes(key)) {
        return {
            name: key,
            elements: tokens.map(serializeMessageToken),
        };
    } else {
        return {
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
            name: "other",
            elements: tokens.map(serializeMessageToken),
        };
    } else {
        return {
            name: "when",
            attributes: { eq: key },
            elements: tokens.map(serializeMessageToken),
        };
    }
};
