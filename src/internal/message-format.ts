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

export function isSupportedMessageFormatElement(element: MessageFormatElement): boolean {
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
