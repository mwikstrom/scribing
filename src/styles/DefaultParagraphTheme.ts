import { ParagraphTheme } from "./ParagraphTheme";
import type { BoxStyle } from "./BoxStyle";
import type { DefaultFlowTheme } from "./DefaultFlowTheme";
import type { FlowTheme } from "./FlowTheme";
import { ParagraphStyle, ParagraphVariant } from "./ParagraphStyle";
import { TextStyle, TextStyleProps } from "./TextStyle";

/** @internal */
export class DefaultParagraphTheme extends ParagraphTheme {
    readonly #root: FlowTheme;
    readonly #box: BoxStyle;
    readonly #text: TextStyle;
    readonly #para: ParagraphStyle;
    readonly #link: TextStyle;
    readonly #next: ParagraphVariant;

    constructor(root: DefaultFlowTheme, box: BoxStyle, paraVariant: ParagraphVariant) {
        super();

        this.#root = root;
        this.#box = box;

        this.#text = new TextStyle({
            fontFamily: getFontFamily(paraVariant),
            fontSize: getFontSize(paraVariant),
            bold: isBoldHeadingParagraph(paraVariant),
            italic: box.variant === "quote" || paraVariant === "h6",
            underline: false,
            strike: false,
            baseline: "normal",
            link: null,
            color: box.color ?? (paraVariant === "subtitle" ? "subtle" : "default"),
            lang: root.lang,
            spellcheck: paraVariant !== "code",
            translate: paraVariant !== "code",
        });

        this.#para = new ParagraphStyle({
            variant: paraVariant,
            alignment: "start",
            direction: root.rtl ? "rtl" : "ltr",
            lineSpacing: paraVariant === "preamble" ? 110 : 100,
            spaceBefore: getSpaceAbove(paraVariant),
            spaceAfter: getSpaceBelow(paraVariant),
            listLevel: 0,
            listMarker: "unordered",
            hideListMarker: false,
            listCounter: "auto",
            listCounterPrefix: "",
            listCounterSuffix: ". ",
        });

        this.#link = new TextStyle({
            underline: true,
            color: "primary",
        });

        this.#next = paraVariant === "title" ? "subtitle" : paraVariant === "code" ? "code" : "normal";
    }

    /** {@inheritdoc ParagraphTheme.getAmbientTextStyle} */
    getAmbientTextStyle(): TextStyle {
        return this.#text;
    }

    /** {@inheritdoc ParagraphTheme.getAmbientParagraphStyle} */
    getAmbientParagraphStyle(): ParagraphStyle {
        return this.#para;
    }

    /** {@inheritdoc ParagraphTheme.getLinkStyle} */
    getLinkStyle(): TextStyle {
        return this.#link;
    }

    /** {@inheritdoc ParagraphTheme.getNextVariant} */
    getNextVariant(): ParagraphVariant {
        return this.#next;
    }

    /** {@inheritdoc ParagraphTheme.getFlowTheme} */
    getFlowTheme(): FlowTheme {
        return this.#root.getBoxTheme(this.#box);
    }
}

const isHeadingParagraph = (variant: ParagraphVariant): boolean => /^h[1-6]$/.test(variant);

const isBoldHeadingParagraph = (variant: ParagraphVariant): boolean => /^h[1-4]$/.test(variant);

const getFontFamily = (variant: ParagraphVariant): TextStyleProps["fontFamily"] => {
    if (variant === "code") {
        return "monospace";
    } else if (isHeadingParagraph(variant) || variant === "title" || variant === "subtitle") {
        return "heading";
    } else {
        return "body";
    }
};

const getFontSize = (variant: ParagraphVariant): number => {
    switch (variant) {
    case "title": return 300;
    case "subtitle": return 125;
    case "h1": return 200;
    case "h2": return 150;
    case "h3": return 117;
    case "h4": return 100;
    case "h5": return 100;
    case "h6": return 100;
    case "code": return 90;
    case "preamble": return 110;
    default: return 100;
    }
};

const getSpaceAbove = (variant: ParagraphVariant): number => {
    if (variant === "title") {
        return 300;
    } else if (variant === "subtitle") {
        return 100;
    } else {
        return getSpaceBelow(variant);
    }
};

const getSpaceBelow = (variant: ParagraphVariant): number => {
    switch (variant) {
    case "subtitle": return 200;
    case "h1": return 134;
    case "h2": return 125;
    case "h3": return 117;
    default: return 100;
    }
};
