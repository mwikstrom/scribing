import { parse as parseMessage } from "@messageformat/parser";
import type {
    Content as MsgFormatContent,
    PlainArg as MsgFormatPlainArg,
    FunctionArg as MsgFormatFunctionArg,
    Select as MsgFormatSelect,
    Octothorpe,
    SelectCase,
} from "@messageformat/parser";

export type MessageToken = MsgFormatContent | MsgFormatPlainArg | MsgFormatFunctionArg | MsgFormatSelect | Octothorpe;

export function isSupportedMessageFormat(message: string): boolean {
    try {
        const tokens = parseMessage(message);
        return tokens.every(isSupportedMessageToken);    
    } catch {
        return false;
    }
}

export function isSupportedMessageToken(token: MessageToken): boolean {
    return (
        isContentToken(token) ||
        isOctothorpe(token) ||
        isArgumentToken(token) ||
        (isPluralToken(token) && hasOtherCase(token.cases) && token.cases.every(isSupportedPluralCase)) ||
        (isSelectOrdinalToken(token) && hasOtherCase(token.cases) && token.cases.every(isSupportedPluralCase)) ||
        (isSelectToken(token) && hasOtherCase(token.cases))
    );
}

function isSupportedPluralCase(token: SelectCase): boolean {
    const { key } = token;
    return isSupportedPluralCaseKey(key);
}

function hasOtherCase(cases: SelectCase[]): boolean {
    return cases.some(({key}) => key === "other");
}

export function isSupportedPluralCaseKey(key: string): boolean {
    return (
        ["zero", "one", "two", "few", "many", "other"].includes(key) ||
        /^=\d+/.test(key)
    );
}

export function isContentToken(token: MessageToken): token is MsgFormatContent {
    return token.type === "content";
}

export function isOctothorpe(token: MessageToken): token is Octothorpe {
    return token.type === "octothorpe";
}

export function isArgumentToken(token: MessageToken): token is MsgFormatPlainArg {
    return token.type === "argument";
}

export function isPluralToken(token: MessageToken): token is MsgFormatSelect & { type: "plural" } {
    return token.type === "plural";
}

export function isSelectOrdinalToken(token: MessageToken): token is MsgFormatSelect & { type: "selectordinal" } {
    return token.type === "selectordinal";
}

export function isSelectToken(token: MessageToken): token is MsgFormatSelect & { type: "select" } {
    return token.type === "select";
}
