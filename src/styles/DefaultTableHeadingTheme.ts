import { FlowThemeOverride } from "./FlowThemeOverride";
import { ParagraphThemeOverride } from "./ParagraphThemeOverride";
import type { DefaultFlowTheme } from "./DefaultFlowTheme";
import type { ParagraphVariant } from "./ParagraphStyle";
import type { ParagraphTheme } from "./ParagraphTheme";
import type { FlowTheme } from "./FlowTheme";
import type { TextStyle } from "./TextStyle";

/** @internal */
export class DefaultTableHeadingTheme extends FlowThemeOverride {
    readonly #mapped = new WeakMap<ParagraphTheme, ParagraphTheme>();

    constructor(root: DefaultFlowTheme) {
        super(root);
    }

    /** {@inheritdoc FlowTheme.getParagraphTheme} */
    getParagraphTheme(variant: ParagraphVariant): ParagraphTheme {
        const theme = super.getParagraphTheme(variant);
        
        if (variant !== "normal") {
            return theme;
        }

        let bold = this.#mapped.get(theme);
        if (!bold) {
            bold = new BoldTextOverride(theme, this);
            this.#mapped.set(theme, bold);
        }

        return bold;
    }
}

class BoldTextOverride extends ParagraphThemeOverride {
    readonly #parent: FlowTheme;
    readonly #mapped = new WeakMap<TextStyle, TextStyle>();

    constructor(inner: ParagraphTheme, parent: FlowTheme) {
        super(inner);
        this.#parent = parent;
    }

    getAmbientTextStyle(): TextStyle {
        const normal = super.getAmbientTextStyle();
        
        if (normal.bold) {
            return normal;
        }

        let bold = this.#mapped.get(normal);
        if (!bold) {
            bold = normal.set("bold", true);
            this.#mapped.set(normal, bold);
        }

        return bold;
    }

    getFlowTheme(): FlowTheme {
        return this.#parent;
    }
}
