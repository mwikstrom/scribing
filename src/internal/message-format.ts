import { 
    parse, 
    MessageFormatElement, 
    isLiteralElement,
    isPluralElement,
    isPoundElement,
    isArgumentElement,
    isSelectElement,
    PluralOrSelectOption,
} from "@formatjs/icu-messageformat-parser";
import { MessageFormatArgumentInfo } from "../structure/MessageFormatArgumentInfo";


export function parseMessageFormat(message: string): MessageFormatElement[] {
    return parse(message, { requiresOtherClause: true });
}

export function isSupportedMessageFormat(message: string): boolean {
    try {
        const elements = parseMessageFormat(message);
        return elements.every(isSupportedMessageFormatElement);    
    } catch {
        return false;
    }
}

export function extractMessageArguments(message: string): MessageFormatArgumentInfo[] {
    try {
        const map = new Map<string, MessageFormatArgumentInfo>();
        const elements = parseMessageFormat(message);
        processMessageArguments(elements, info => {
            const { key } = info;
            if (key) {
                let { free = false, numeric = false, choice = false, options = [] } = info;
                const prev = map.get(key);
                if (prev) {
                    free = prev.free || free;
                    numeric = prev.numeric || numeric;
                    choice = prev.choice || choice;
                    options = Array.from(new Set([...prev.options, ...options]));
                }
                map.set(key, { key, free, numeric, choice, options });
            }
        });
        return Array.from(map.values());
    } catch {
        return [];
    }
}

function processMessageArguments(
    array: MessageFormatElement[],
    callback: (info: Partial<MessageFormatArgumentInfo>) => void,
): void {
    for (const element of array) {
        if (isArgumentElement(element)) {
            const { value: key } = element;
            callback({key, free: true});
        } else if (isPluralElement(element)) {
            const { value: key, options: optionRecord } = element;
            const options = Object.keys(optionRecord).filter(k => k.startsWith("=")).map(k => k.substring(1));
            callback({key, numeric: true, options});
            Object.values(optionRecord).forEach(opt => processMessageArguments(opt.value, callback));
        } else if (isSelectElement(element)) {
            const { value: key, options: optionRecord } = element;
            const options = Object.keys(optionRecord);
            callback({key, choice: true, options});
            Object.values(optionRecord).forEach(opt => processMessageArguments(opt.value, callback));
        }
    }
}

function isSupportedMessageFormatElement(element: MessageFormatElement): boolean {
    return (
        isLiteralElement(element) ||
        isPoundElement(element) ||
        isArgumentElement(element) ||
        (
            isPluralElement(element) && 
            Object.entries(element.options).every(([key, value]) => isSupportedPluralOption(key, value))
        ) ||
        (
            isSelectElement(element) && 
            Object.values(element.options).flatMap(option => option.value).every(isSupportedMessageFormatElement)
        )
    );
}

export function isSupportedPluralCaseKey(key: string): boolean {
    return (
        ["zero", "one", "two", "few", "many", "other"].includes(key) ||
        /^=\d+/.test(key)
    );
}

const isSupportedPluralOption = (key: string, option: PluralOrSelectOption): boolean => (
    isSupportedPluralCaseKey(key) &&
    option.value.every(isSupportedMessageFormatElement)
);
