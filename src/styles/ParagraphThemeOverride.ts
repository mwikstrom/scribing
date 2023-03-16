import { ParagraphTheme } from "./ParagraphTheme";
import type { FlowTheme } from "./FlowTheme";
import type { ParagraphStyle, ParagraphVariant } from "./ParagraphStyle";
import type { TextStyle } from "./TextStyle";

/** @internal */
export abstract class ParagraphThemeOverride extends ParagraphTheme {
    protected readonly _inner: ParagraphTheme;

    constructor(inner: ParagraphTheme) {
        super();
        this._inner = inner;
    }

    getAmbientTextStyle(): TextStyle {
        return this._inner.getAmbientTextStyle();
    }

    getAmbientParagraphStyle(): ParagraphStyle {
        return this._inner.getAmbientParagraphStyle();
    }

    getFlowTheme(): FlowTheme {
        return this._inner.getFlowTheme();
    }

    getLinkStyle(): TextStyle {
        return this._inner.getLinkStyle();
    }

    getNextVariant(): ParagraphVariant {
        return this._inner.getNextVariant();
    }
}
