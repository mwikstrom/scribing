import { 
    constType, 
    frozen, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    Type, 
    validating 
} from "paratype";
import { FlowTheme } from "./FlowTheme";
import { FlowThemeRegistry } from "./internal/class-registry";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextStyle } from "./TextStyle";

const Data = "default" as const;
const PropsType: RecordType<{/*empty*/}> = recordType({});
const DataType: Type<typeof Data> = constType(Data);
const propsToData = () => Data;

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
@frozen
@validating
@FlowThemeRegistry.register
export class DefaultFlowTheme extends DefaultFlowThemeBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => DefaultFlowTheme);

    /** Gets a cached instance of the default flow theme */
    public static get instance(): DefaultFlowTheme {
        if (!CACHED) {
            CACHED = new DefaultFlowTheme();
        }
        return CACHED;
    }

    constructor() { super({}); }

    /** {@inheritdoc FlowTheme.getParagraphTheme} */
    getParagraphTheme(): FlowTheme {
        // TODO: Implement DefaultFlowTheme.getParagraphTheme
        return this;
    }

    /** {@inheritdoc FlowTheme.getAmbientTextStyle} */
    getAmbientTextStyle(): TextStyle {
        // TODO: Implement DefaultFlowTheme.getAmbientTextStyle
        return TextStyle.empty;
    }

    /** {@inheritdoc FlowTheme.getAmbientParagraphStyle} */
    getAmbientParagraphStyle(): ParagraphStyle {
        // TODO: Implement DefaultFlowTheme.getAmbientParagraphStyle
        return ParagraphStyle.empty;
    }
}

let CACHED: DefaultFlowTheme | undefined;
