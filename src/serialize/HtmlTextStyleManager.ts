import { TextStyle, TextStyleProps } from "../styles/TextStyle";
import { EndScopeFunc, XmlWriter } from "./XmlWriter";

/** @internal */
export class HtmlTextStyleManager {
    readonly #writer: XmlWriter;
    readonly #ambient: TextStyle;
    readonly #stack: StackEntry[] = [];

    constructor(writer: XmlWriter, ambient: TextStyle) {
        this.#writer = writer;
        this.#ambient = ambient;
    }

    public apply(style: TextStyle): void {
        // TODO: link
        // TODO: underline
        // TODO: strike
        // TODO: fontFamily
        // TODO: fontSize
        // TODO: color
        this.#applyBooleanStyle("bold", style, "b", { fontWeight: "normal" });
        this.#applyBooleanStyle("italic", style, "i", { fontStyle: "normal" });
        // TODO: baseline
    }

    public dispose(): void {
        this.#stack.splice(0, this.#stack.length).reverse().forEach(({ end }) => end());
    }

    #applyBooleanStyle(
        key: keyof TextStyleProps,
        style: TextStyle,
        set: string | CssProps,
        unset: string | CssProps
    ): void {
        const value = style[key];

        for (let i = this.#stack.length - 1; i >= 0; --i) {
            const scoped = this.#stack[i].style[key];
            if (scoped === value) {
                return;
            } else if (scoped !== undefined) {
                this.#stack.splice(i, this.#stack.length - i).reverse().forEach(({ end }) => end());
            }
        }

        if (value !== undefined && this.#ambient[key] !== value) {
            this.#push(value ? set : unset, { [key]: value });
        }
    }

    #push(tagOrCss: string | CssProps, style: Partial<TextStyleProps>): void {
        let end: EndScopeFunc;

        if (typeof tagOrCss === "string") {
            end = this.#writer.start(tagOrCss);
        } else {
            end = this.#writer.start("span", { style: makeCssString(tagOrCss) });
        }
        
        this.#stack.push({ end, style });
    }
}

interface StackEntry {
    end: EndScopeFunc;
    style: Partial<TextStyleProps>;
}

interface CssProps {
    fontWeight?: "normal";
    fontStyle?: "normal";
}

const CssPropNames: Record<keyof CssProps, string> = {
    fontWeight: "font-weight",
    fontStyle: "font-style",
};

const makeCssString = (props: CssProps): string => {
    const entries: string[] = [];
    for (const [key, name] of Object.entries(CssPropNames)) {
        const value = props[key as keyof CssProps];
        if (value !== undefined) {
            entries.push(`${name}:${value}`);
        }
    }
    return entries.join(";");
};
