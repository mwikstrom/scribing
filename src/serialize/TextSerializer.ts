import { DynamicText } from "../nodes/DynamicText";
import { FlowBox } from "../nodes/FlowBox";
import { FlowNode } from "../nodes/FlowNode";
import { LineBreak } from "../nodes/LineBreak";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { TextRun } from "../nodes/TextRun";
import { FlowCursor } from "../selection/FlowCursor";
import { FlowContent } from "../structure/FlowContent";
import { FlowNodeVisitor } from "../structure/FlowNodeVisitor";
import { FlowTableContent } from "../structure/FlowTableContent";
import { ListMarkerKind, OrderedListMarkerKindType, ParagraphStyle } from "../styles/ParagraphStyle";
import type { FlowContentTextOptions } from "./serialize-text";

/** @internal */
export class TextSerializer extends FlowNodeVisitor {
    readonly #endOfLine: string;
    readonly #endOfPara: string;
    readonly #dynamicTextReplacement: string;
    readonly #parts: string[] = [];

    constructor(options: FlowContentTextOptions) {
        super();

        const { endOfLine, dynamicTextReplacement } = options;

        this.#endOfLine = endOfLine;
        this.#endOfPara = endOfLine + endOfLine;
        this.#dynamicTextReplacement = dynamicTextReplacement;
    }

    getResult(): string {
        return this.#parts.join("");
    }

    visitFlowContent(content: FlowContent): FlowContent {
        let nextPara: ParagraphBreak | null | undefined = null;
        let prevPara: ParagraphBreak | undefined;
        const listStack: number[] = [];

        for (let cursor: FlowCursor | null = content.peek(0); cursor; cursor = cursor.moveToStartOfNextNode()) {
            if (nextPara === null) {
                const found = cursor.findNodeForward(ParagraphBreak.classType.test)?.node;
                if (found instanceof ParagraphBreak) {
                    nextPara = found;
                    startParagraph(nextPara.style, this.#parts, listStack, prevPara?.style);
                }
            }

            const { node } = cursor;

            if (node) {
                this.visitNode(node);

                if (node === nextPara) {
                    prevPara = nextPara;
                    nextPara = null;
                }
            }
        }

        return content;
    }

    visitDynamicText(node: DynamicText): FlowNode {
        this.#parts.push(this.#dynamicTextReplacement);
        return node;
    }

    visitBox(node: FlowBox): FlowNode {
        const { style, content } = node;
        if (!style.inline) {
            this.#ensureStartOfLine();
        }
        this.visitFlowContent(content);
        if (!style.inline) {
            this.#ensureStartOfLine();
        }
        return node;
    }

    visitTableContent(content: FlowTableContent): FlowTableContent {
        for (const pos of content.positions) {
            const cell = content.getCell(pos, false);
            if (cell) {
                this.#ensureStartOfParagraph();
                this.visitFlowContent(cell.content);
                this.#ensureStartOfParagraph();
            }            
        }
        return content;
    }

    visitLineBreak(node: LineBreak): FlowNode {
        this.#ensureStartOfLine();
        return node;
    }

    visitParagraphBreak(node: ParagraphBreak): FlowNode {
        this.#ensureStartOfParagraph();
        return node;
    }

    visitTextRun(node: TextRun): FlowNode {
        this.#parts.push(node.text);
        return node;
    }

    #ensureStartOfLine(): void {
        if (this.#parts.length > 0 && !this.#endsWith(this.#endOfLine)) {
            this.#parts.push(this.#endOfLine);
        }
    }

    #ensureStartOfParagraph(): void {
        if (this.#parts.length > 0 && !this.#endsWith(this.#endOfPara)) {
            if (this.#endsWith(this.#endOfLine)) {
                this.#parts.push(this.#endOfLine);
            } else {
                this.#parts.push(this.#endOfPara);
            }
        }        
    }

    #endsWith(text: string): boolean {
        return this.#tail(text.length) === text;
    }

    #tail(count: number): string {
        const builder: string[] = [];
        for (let i = this.#parts.length - 1; i >= 0; --i) {
            const part = this.#parts[i];
            const take = Math.min(count, part.length);

            if (take <= 0) {
                break;
            }

            builder.unshift(part.substring(part.length - take));
            count -= take;
        }
        return builder.join("");
    }
}

const startParagraph = (style: ParagraphStyle, output: string[], listStack: number[], prev?: ParagraphStyle): void => {
    const {
        listLevel = 0,
        hideListMarker,
        listMarker = "unordered",
        listCounter = "auto",
        listCounterPrefix,
        listCounterSuffix = "."
    } = style;

    if (listLevel <= 0) {
        return;
    }

    let marker = "\t".repeat(listLevel - 1);
    
    if (!hideListMarker) {
        const renderFunc = ListMarker[listMarker] || ListMarker["unordered"];

        while (listStack.length > listLevel) {
            listStack.pop();
        }

        while (listStack.length < listLevel) {
            listStack.push(0);
        }

        let count = (listStack.pop() || 0) + 1;

        if (typeof listCounter === "number") {
            count = listCounter;
        } else if (listCounter === "reset" || (listCounter === "auto" && (!prev || !prev.listLevel))) {
            count = 1;
        }
        
        if (OrderedListMarkerKindType.test(listMarker) && listCounterPrefix) {
            marker += listCounterPrefix;
        }

        marker += renderFunc(count);

        if (OrderedListMarkerKindType.test(listMarker)) {
            marker += listCounterSuffix;
        }

        listStack.push(count);
    }

    marker += "\t";
    output.push(marker);
};

const decimal = (value: number) => value.toFixed(0);

const lowerAlpha = (value: number): string => upperAlpha(value).toLowerCase();

const upperAlpha = (value: number): string => {
    if (value <= 0 || !Number.isSafeInteger(value)) {
        return decimal(value);
    }    

    let result = "";
    while (value >= 26) {
        const rem = value % 26;
        result = String.fromCharCode(64 + rem) + result;
        value = (value - rem) / 26 - 1;
    }

    return String.fromCharCode(64 + value) + result;
};

const lowerRoman = (value: number): string => upperRoman(value).toLowerCase();

const upperRoman = (value: number): string => {
    if (value <= 0 || !Number.isSafeInteger(value)) {
        return decimal(value);
    }    

    const ROMAN: Record<string, number> = {
        M:1000,
        CM:900,
        D:500,
        CD:400,
        C:100,
        XC:90,
        L:50,
        XL:40,
        X:10,
        IX:9,
        V:5,
        IV:4,
        I:1
    };

    let result = "";
    for (const key in ROMAN) {
        while (value >= ROMAN[key]) {
            result += key;
            value -= ROMAN[key];
        }
    }

    return result;
};

const ListMarker: Record<ListMarkerKind, (position: number) => string> = {
    ordered: decimal,
    decimal: decimal,
    "lower-alpha": lowerAlpha,
    "upper-alpha": upperAlpha,
    "lower-roman": lowerRoman,
    "upper-roman": upperRoman,
    unordered: () => "•",
    disc: () => "•",
    circle: () => "◦",
    square: () => "▪",
    dash: () => "-"
};
