import { frozen, lazyType, nullType, RecordClass, recordType, type, unionType, validating } from "paratype";
import { FlowTheme } from ".";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowSelection } from "./FlowSelection";
import { FlowOperationRegistry, FlowSelectionRegistry, FlowThemeRegistry } from "./internal/class-registry";

/**
 * Properties for {@link FlowEditorState}
 * @public
 */
export interface FlowEditorStateProps {
    content: FlowContent;
    selection: FlowSelection | null;
}

const Props = {
    content: lazyType(() => FlowContent.classType),
    selection: unionType(lazyType(FlowSelectionRegistry.close), nullType),
};

const PropsType = recordType(Props);

/**
 * The base record class for {@link FlowEditorState}
 * @public
 */
export const FlowEditorStateBase = RecordClass(PropsType);

/**
 * Immutable state record for a flow content editor
 * @public
 * @sealed
 */
@frozen
@validating 
export class FlowEditorState extends FlowEditorStateBase {
    /** Gets an empty flow editor state */
    public static get empty(): FlowEditorState {
        if (!EMPTY_CACHE) {
            EMPTY_CACHE = new FlowEditorState({
                content: new FlowContent(),
                selection: null,
            });
        }
        return EMPTY_CACHE;
    }

    /**
     * Gets a new flow editor state, based on the current state, and with the specified
     * operation applied.
     * @param operation - The operation to apply
     * @param theme - Theme of the flow content
     */
    public applyMine(
        @type(lazyType(FlowOperationRegistry.close)) operation: FlowOperation,
        @type(lazyType(FlowThemeRegistry.close)) theme: FlowTheme,
    ): FlowEditorState {
        return this.#apply(operation, true, theme);
    }

    /**
     * Gets a new flow editor state, based on the current state, and with the specified
     * operation applied.
     * @param operation - The operation to apply
     * @param theme - Theme of the flow content
     */
    public applyTheirs(
        @type(lazyType(FlowOperationRegistry.close)) operation: FlowOperation,
        @type(lazyType(FlowThemeRegistry.close)) theme: FlowTheme,
    ): FlowEditorState {
        return this.#apply(operation, false, theme);
    }

    #apply(operation: FlowOperation, mine: boolean, theme: FlowTheme): FlowEditorState {
        const content = operation.applyToContent(this.content, theme);
        const selection = this.selection ? operation.applyToSelection(this.selection, mine) : null;
        return this.merge({ content, selection });
    }
}

let EMPTY_CACHE: FlowEditorState | undefined;
