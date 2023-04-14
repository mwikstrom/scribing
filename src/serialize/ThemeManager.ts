import { CellPosition } from "../selection/CellPosition";
import { BoxStyle } from "../styles/BoxStyle";
import { DefaultFlowTheme } from "../styles/DefaultFlowTheme";
import { FlowTheme } from "../styles/FlowTheme";
import { ParagraphVariant } from "../styles/ParagraphStyle";
import { ParagraphTheme } from "../styles/ParagraphTheme";
import type { EndScopeFunc } from "./XmlWriter";

/**
 * @internal
 */
export class ThemeManager {
    #stack: (FlowTheme | ParagraphTheme)[] = [];

    constructor(root?: FlowTheme) {
        if (root) {
            this.#stack.push(root);
        }
    }

    public get current(): FlowTheme | ParagraphTheme {
        const stackLength = this.#stack.length;
        if (stackLength > 0) {
            return this.#stack[stackLength - 1];
        } else {
            return DefaultFlowTheme.instance;
        }
    }

    public get flow(): FlowTheme {
        const { current } = this;
        if (current instanceof ParagraphTheme) {
            return current.getFlowTheme();
        } else {
            return current;
        }
    }

    public get para(): ParagraphTheme {
        const { current } = this;
        if (current instanceof ParagraphTheme) {
            return current;
        } else {
            return current.getParagraphTheme("normal");
        }
    }

    public startPara(variant?: ParagraphVariant): EndScopeFunc {
        return this.start(this.flow.getParagraphTheme(variant || "normal"));
    }

    public startBox(style: BoxStyle): EndScopeFunc {
        return this.start(this.flow.getBoxTheme(style));
    }

    public startTableCell(key: string, headingRowCount = 0): EndScopeFunc {
        let cellTheme: FlowTheme | undefined;

        if (headingRowCount > 0) {
            const rowIndex = CellPosition.parseRowIndex(key, false);
            if (typeof rowIndex === "number" && rowIndex < headingRowCount) {
                cellTheme = this.flow.getTableHeadingTheme();
            }
        }

        if (!cellTheme) {
            cellTheme = this.flow.getTableBodyTheme();
        }

        return this.start(cellTheme);
    }

    public start(theme: FlowTheme | ParagraphTheme): EndScopeFunc {
        this.#stack.push(theme);
        return () => {
            const popped = this.#stack.pop();
            if (popped !== theme) {
                throw new Error("Closing unexpected theme");
            }
        };
    }
}
