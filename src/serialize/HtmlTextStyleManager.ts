import { Attributes } from "xml-js";
import { TextStyle, TextStyleProps } from "../styles/TextStyle";
import { EndScopeFunc, XmlWriter } from "./XmlWriter";
import type { FlowContentHtmlClassKey } from "./serialize-html";

/** @internal */
export class HtmlTextStyleManager {
    readonly #writer: XmlWriter;
    readonly #ambient: TextStyle;
    readonly #stack: StackEntry[] = [];
    readonly #classes: Partial<Record<FlowContentHtmlClassKey, string>>;

    constructor(
        writer: XmlWriter,
        ambient: TextStyle,
        classes?: Partial<Record<FlowContentHtmlClassKey, string>>
    ) {
        this.#writer = writer;
        this.#ambient = ambient;
        this.#classes = classes || {};
    }

    public apply(style: TextStyle): void {
        const provisional = getProvisionalEntries(this.#stack, this.#ambient, style, this.#classes);
        const rewritten: ProvisionalEntry[] = [];

        for (const next of provisional) {
            const prev = rewritten.pop();
            if (prev) {
                const combined = tryMergeProvisional(prev, next);
                if (combined) {
                    rewritten.push(combined);
                } else {
                    rewritten.push(prev, next);
                }
            } else {
                rewritten.push(next);
            }
        }

        for (const entry of rewritten) {
            const { elem, style } = entry;
            const end = this.#start(elem);
            this.#stack.push({ end, style });
        }
    }

    public dispose(): void {
        this.#stack.splice(0, this.#stack.length).reverse().forEach(({ end }) => end());
    }

    #start(elem: RenderElem): EndScopeFunc {
        const { tagName = "span", className, style } = elem;
        const attr: Attributes = {};

        if (className) {
            attr.class = className.trim().split(/\s+/).join(" ");
        }

        if (style) {
            attr.style = Object.entries(style).map(([key, value]) => `${key}:${value}`).join(";");
        }

        return this.#writer.start(tagName, attr);
    }
}

const getProvisionalEntries = (
    stack: StackEntry[],
    ambient: TextStyle,
    style: TextStyle,
    classes: Partial<Record<FlowContentHtmlClassKey, string>>
) => {
    const actionQueue: (() => ProvisionalEntry | undefined)[] = [];

    const renderClass = (key: FlowContentHtmlClassKey): RenderElem => ({
        className: classes[key] || key
    });

    const pop = <K extends keyof TextStyleProps>(key: K): void => {
        const value = style[key];

        for (let i = stack.length - 1; i >= 0; --i) {
            const scoped = stack[i].style[key];
            if (scoped !== undefined) {
                if (scoped === value) {
                    return;
                } else {
                    stack.splice(i, stack.length - i).reverse().forEach(({ end }) => end());
                }
            }
        }
    };

    const provision = <K extends keyof TextStyleProps>(
        key: K,
        render: (value: Exclude<TextStyle[K], undefined>) => RenderElem,
    ): ProvisionalEntry | undefined => {
        const value = style[key];

        for (let i = stack.length - 1; i >= 0; --i) {
            const scoped = stack[i].style[key];
            if (scoped !== undefined) {
                if (scoped === value) {
                    return;
                }
            }
        }
                
        if (value !== undefined && ambient[key] !== value) {
            const elem = render(value as Exclude<TextStyle[K], undefined>);
            return { elem, style: { [key]: value } };
        }
    };

    const register = <K extends keyof TextStyleProps>(
        key: K,
        render: (value: Exclude<TextStyle[K], undefined>) => RenderElem,
    ): void => {
        pop(key);
        actionQueue.push(() => provision(key, render));
    };

    // TODO: link

    register(
        "fontSize",
        value => renderCssProp("font-size", `${value / 100}rem`),
    );

    register(
        "fontFamily",
        value => renderClass(`${value}Font`),
    );

    register(
        "color",
        value => renderClass(`${value}TextColor`),
    );

    register(
        "underline",
        value => value ? renderTag("u") : renderClass("notUnderline"),
    );

    register(
        "strike",
        value => value ? renderTag("s") : renderClass("notStrike"),
    );

    register(
        "bold",
        value => value ? renderTag("b") : renderClass("notBold"),
    );

    register(
        "italic",
        value => value ? renderTag("i") : renderClass("notItalic"),
    );

    register(
        "baseline",
        value => value === "normal" ? renderClass("normalBaseline") : renderTag(value.substring(0, 3)),
    );

    const result: ProvisionalEntry[] = [];
    for (const action of actionQueue) {
        const entry = action();
        if (entry) {
            result.push(entry);
        }
    }
    return result;
};

const renderTag = (tagName: string): RenderElem => ({ tagName });

const renderCssProp = (cssName: string, value: string) => ({ style: { [cssName]: value } });

const tryMergeProvisional = (parent: ProvisionalEntry, child: ProvisionalEntry): ProvisionalEntry | undefined => {
    if (!parent.elem.tagName || !child.elem.tagName || parent.elem.tagName === child.elem.tagName) {
        return {
            elem: {
                tagName: parent.elem.tagName || child.elem.tagName,
                className: [parent.elem.className, child.elem.className].filter(n => !!n).map(n => n?.trim()).join(" "),
                style: { ...parent.elem.style, ...child.elem.style },
            },
            style: { ...parent.style, ...child.style },
        };
    }
};

interface RenderElem {
    tagName?: string;
    className?: string;
    style?: Record<string, string>;
}

interface ProvisionalEntry {
    elem: RenderElem;
    style: Partial<TextStyleProps>;
}

interface StackEntry {
    end: EndScopeFunc;
    style: Partial<TextStyleProps>;
}
