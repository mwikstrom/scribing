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

    public leave(): void {
        this.#stack.pop();
    }
}