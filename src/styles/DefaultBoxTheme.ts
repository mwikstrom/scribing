import { DefaultParagraphTheme } from "./DefaultParagraphTheme";
import { FlowThemeOverride } from "./FlowThemeOverride";
import type { BoxStyle } from "./BoxStyle";
import type { DefaultFlowTheme } from "./DefaultFlowTheme";
import type { ParagraphVariant } from "./ParagraphStyle";
import type { ParagraphTheme } from "./ParagraphTheme";

/** @internal */
export class DefaultBoxTheme extends FlowThemeOverride {
    readonly #boxStyle: BoxStyle;
    readonly #paragraphThemeCache = new Map<ParagraphVariant, DefaultParagraphTheme>();

    constructor(inner: DefaultFlowTheme, boxStyle: BoxStyle) {
        super(inner);
        this.#boxStyle = boxStyle;
    }

    /** {@inheritdoc FlowTheme.getParagraphTheme} */
    getParagraphTheme(variant: ParagraphVariant): ParagraphTheme {
        let result = this.#paragraphThemeCache.get(variant);
        if (!result) {
            result = new DefaultParagraphTheme(this._inner, this.#boxStyle, variant);
            this.#paragraphThemeCache.set(variant, result);
        }
        return result;
    }
}
