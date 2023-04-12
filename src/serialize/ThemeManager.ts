import { CellPosition } from "../selection/CellPosition";
import { BoxStyle } from "../styles/BoxStyle";
import { DefaultFlowTheme } from "../styles/DefaultFlowTheme";
import { FlowTheme } from "../styles/FlowTheme";
import { ParagraphVariant } from "../styles/ParagraphStyle";
import { ParagraphTheme } from "../styles/ParagraphTheme";

/**
 * @internal
 */
export class ThemeManager {
    #stack: FlowTheme[] = [];
    #para: ParagraphTheme | undefined;

    constructor(root?: FlowTheme) {
        if (root) {
            this.#stack.push(root);
        }
    }

    public get current(): FlowTheme {
        const stackLength = this.#stack.length;
        if (stackLength > 0) {
            return this.#stack[stackLength - 1];
        } else {
            return DefaultFlowTheme.instance;
        }
    }

    public get para(): ParagraphTheme {
        if (!this.#para) {
            this.#para = this.current.getParagraphTheme("normal");
        }
        return this.#para;
    }

    public resetPara(variant?: ParagraphVariant): void {
        if (variant) {
            this.#para = this.current.getParagraphTheme(variant);
        } else {
            this.#para = undefined;
        }
    }

    public enterBox(style: BoxStyle): void {
        this.#stack.push(this.current.getBoxTheme(style));
        this.resetPara();
    }

    public enterTableCell(key: string, headingRowCount = 0): void {
        let cellTheme: FlowTheme | undefined;

        if (headingRowCount > 0) {
            const rowIndex = CellPosition.parseRowIndex(key, false);
            if (typeof rowIndex === "number" && rowIndex < headingRowCount) {
                cellTheme = this.current.getTableHeadingTheme();
            }
        }

        if (!cellTheme) {
            cellTheme = this.current.getTableBodyTheme();
        }

        this.#stack.push(cellTheme);
        this.resetPara();
    }

    public leave(): void {
        this.#stack.pop();
    }
}