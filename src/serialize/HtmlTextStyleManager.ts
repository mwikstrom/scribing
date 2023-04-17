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
        this.#applyBoolean("bold", style, "b", { fontWeight: "normal" });
        
        this.#applyBoolean("italic", style, "i", { fontStyle: "normal" });

        this.#applyScalar(
            "baseline",
            style,
            value => value === "sub" ? "sub" : value === "super" ? "sup" : { fontSize: "unset", verticalAlign: "unset" }
        );
    }

    public dispose(): void {
        this.#stack.splice(0, this.#stack.length).reverse().forEach(({ end }) => end());
    }

    #applyBoolean(
        key: keyof TextStyleProps,
        style: TextStyle,
        set: string | CssProps,
        unset: string | CssProps
    ): void {
        this.#applyScalar(key, style, value => value ? set : unset);
    }

    #applyScalar<K extends keyof TextStyleProps>(
        key: K,
        style: TextStyle,
        render: (value: TextStyle[K]) => string | CssProps,
    ): void {
        const value = style[key];

        for (let i = this.#stack.length - 1; i >= 0; --i) {
            const scoped = this.#stack[i].style[key];
            if (scoped !== undefined) {
                if (scoped === value) {
                    return;
                } else {
                    this.#stack.splice(i, this.#stack.length - i).reverse().forEach(({ end }) => end());
                }
            }
        }

        if (value !== undefined && this.#ambient[key] !== value) {
            this.#push(render(value), { [key]: value });
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
    fontSize?: string;
    verticalAlign?: string;
}

const CssPropNames: Record<keyof CssProps, string> = {
    fontWeight: "font-weight",
    fontStyle: "font-style",
    fontSize: "font-size",
    verticalAlign: "vertical-align",
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
