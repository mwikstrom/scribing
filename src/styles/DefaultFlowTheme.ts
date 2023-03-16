import { 
    booleanType,
    constType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    stringType, 
    Type, 
    unionType, 
} from "paratype";
import { BoxStyle } from "./BoxStyle";
import { FlowTheme } from "./FlowTheme";
import { FlowThemeRegistry } from "../internal/class-registry";
import { ParagraphVariant } from "./ParagraphStyle";
import { ParagraphTheme } from "./ParagraphTheme";
import { DefaultBoxTheme } from "./DefaultBoxTheme";
import { DefaultTableHeadingTheme } from "./DefaultTableHeadingTheme";

const Props = {
    lang: stringType,
    rtl: booleanType,
};
const DEFAULT_CONST = "default" as const;
const PropsType: RecordType<DefaultFlowThemeProps> = recordType(Props);
const DataType: Type<DefaultFlowThemeData> = unionType(
    constType(DEFAULT_CONST),
    PropsType.asPartial()
);
const propsToData = (props: DefaultFlowThemeProps): DefaultFlowThemeData => {
    const { lang, rtl } = props;
    if (!lang && !rtl) {
        return DEFAULT_CONST;
    }
    const data: Partial<DefaultFlowThemeProps> = {};
    if (lang) {
        data.lang = lang;
    }
    if (rtl) {
        data.rtl = rtl;
    }
    return data;
};

/**
 * Properties for {@link DefaultFlowTheme}
 * @public
 */
export interface DefaultFlowThemeProps {
    lang: string;
    rtl: boolean;
}

/**
 * Data for {@link DefaultFlowTheme}
 * @public
 */
export type DefaultFlowThemeData = "default" | Partial<DefaultFlowThemeProps>;

/**
 * The base record class for {@link DefaultFlowTheme}
 * @public
 */
export const DefaultFlowThemeBase = RecordClass(PropsType, FlowTheme, DataType, propsToData);

/**
 * Provides a theme for flow content
 * @sealed
 * @public
 */
@FlowThemeRegistry.register
export class DefaultFlowTheme extends DefaultFlowThemeBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => DefaultFlowTheme);

    public static fromData(data: DefaultFlowThemeData): DefaultFlowTheme {
        if (data === "default") {
            data = {};
        }
        const { lang, rtl } = data;
        return DefaultFlowTheme.get(lang, rtl);
    }

    /** Gets a cached instance of the default flow theme */
    public static get instance(): DefaultFlowTheme { return DefaultFlowTheme.get(); }

    public static get(lang = "", rtl = false): DefaultFlowTheme {
        let entry = BY_LANG_CACHE.get(lang);
        if (!entry) {
            BY_LANG_CACHE.set(lang, entry = {});
        }
        const prop: "rtl" | "ltr" = rtl ? "rtl" : "ltr";
        let found = entry[prop];
        if (!found) {
            entry[prop] = found = new DefaultFlowTheme({lang, rtl});
        }
        return found;
    }

    readonly #strongBoxCache = new Map<BoxStyle, DefaultBoxTheme>();
    readonly #weakBoxCache = new WeakMap<BoxStyle, DefaultBoxTheme>();
    
    /** {@inheritdoc FlowTheme.getBoxTheme} */
    getBoxTheme(style: BoxStyle): FlowTheme {
        let result = this.#weakBoxCache.get(style);

        if (!result) {
            const strong = style.unmerge(BoxStyle.ambient);
            result = this.#strongBoxCache.get(strong);
    
            if (!result) {
                for (const [key, value] of this.#strongBoxCache.entries()) {
                    if (strong.equals(key)) {
                        result = value;
                        break;
                    }
                }
    
                if (!result) {
                    this.#strongBoxCache.set(strong, result = new DefaultBoxTheme(this, strong));
                }
            }
        
            this.#weakBoxCache.set(style, result);
        }
    
        return result;
    }

    /** {@inheritdoc FlowTheme.getParagraphTheme} */
    getParagraphTheme(variant: ParagraphVariant): ParagraphTheme {
        return this.getBoxTheme(BoxStyle.empty).getParagraphTheme(variant);
    }

    #tableHeading: FlowTheme | undefined;

    /** {@inheritdoc FlowTheme.getTableHeadingTheme} */
    getTableHeadingTheme(): FlowTheme {
        if (!this.#tableHeading) {
            this.#tableHeading = new DefaultTableHeadingTheme(this);
        }
        return this.#tableHeading;
    }
}

const BY_LANG_CACHE = new Map<string, {rtl?: DefaultFlowTheme, ltr?: DefaultFlowTheme}>();
