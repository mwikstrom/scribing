import { FlowTheme } from "./FlowTheme";
import type { BoxStyle } from "./BoxStyle";
import type { DefaultFlowTheme } from "./DefaultFlowTheme";
import type { ParagraphVariant } from "./ParagraphStyle";
import type { ParagraphTheme } from "./ParagraphTheme";

/** @internal */
export abstract class FlowThemeOverride extends FlowTheme {
    protected readonly _inner: DefaultFlowTheme;

    constructor(inner: DefaultFlowTheme) {
        super();
        this._inner = inner;
    }

    /** {@inheritdoc FlowTheme.getParagraphTheme} */
    getParagraphTheme(variant: ParagraphVariant): ParagraphTheme {
        return this._inner.getParagraphTheme(variant);
    }
    
    /** {@inheritdoc FlowTheme.getBoxTheme} */
    getBoxTheme(style: BoxStyle): FlowTheme {
        return this._inner.getBoxTheme(style);
    }

    /** {@inheritdoc FlowTheme.getTableHeadingTheme} */
    getTableBodyTheme(): FlowTheme {
        return this._inner.getTableBodyTheme();
    }

    /** {@inheritdoc FlowTheme.getTableHeadingTheme} */
    getTableHeadingTheme(): FlowTheme {
        return this._inner.getTableHeadingTheme();
    }
}
