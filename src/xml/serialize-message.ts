import { Element as XmlElem } from "xml-js";
/*import {
    parse as parseMessage,
    Content as MsgFormatContent,
    PlainArg as MsgFormatPlainArg,
    FunctionArg as MsgFormatFunctionArg,
    Select as MsgFormatSelect,
    Octothorpe,
    SelectCase,
} from "@messageformat/parser";*/

export const serializeMessage = (key: string, message: string): XmlElem => {
    return {
        type: "element",
        name: "message",
        attributes: { key },
        //elements: serializeMessageBody(message),
        elements: [{
            type: "text",
            text: message
        }]
    };
};

/*
const serializeMessageBody = (message: string): XmlElem[] => {
    try {
        const tokens = parseMessage(message, { strict: true });
        return tokens.map(serializeMessageToken);    
    } catch (error) {
        console.error(`Invalid message format: ${message}`);
        return [{
            type: "element",
            name: "c",
            elements: [{ type: "text", text: message }],
        }];
    }
};

type MessageToken = MsgFormatContent | MsgFormatPlainArg | MsgFormatFunctionArg | MsgFormatSelect | Octothorpe;
const serializeMessageToken = (token: MessageToken): XmlElem => {
    const { type } = token;
    if (type === "content") {
        const { value } = token;
        return {
            type: "element",
            name: "t",
            elements: [{ type: "text", text: value }],
        };
    } else if (type === "octothorpe") {
        return { type: "element", name: "count" };
    } else if (type === "argument") {
        const { arg } = token;
        return {
            type: "element",
            name: "value",
            attributes: {
                var: arg,
            },
        };
    } else if (type === "plural") {
        const { arg, cases, pluralOffset: offset } = token;
        return {
            type: "element",
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
            type: "element",
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
            type: "element",
            name: "choose",
            attributes: { var: arg },
            elements: cases.map(serializeSelectCase),
        };
    } else {
        const { ctx: { text }, ...other } = token;
        console.error(`Unsupported message format token: ${JSON.stringify(other)}`);
        return {
            type: "element",
            name: "c",
            elements: [{ text }],
        };
    }
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
*/