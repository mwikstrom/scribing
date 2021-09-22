import { arrayType, frozen, lazyType, nullType, RecordClass, recordType, type, unionType, validating } from "paratype";
import { ParagraphStyleProps, TextStyleProps } from ".";
import { DefaultFlowTheme } from "./DefaultFlowTheme";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowSelection } from "./FlowSelection";
import { FlowTheme } from "./FlowTheme";
import { FlowOperationRegistry, FlowSelectionRegistry, FlowThemeRegistry } from "./internal/class-registry";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextStyle } from "./TextStyle";

const operationStackType = arrayType(FlowOperation.baseType).frozen();

/**
 * Properties for {@link FlowEditorState}
 * @public
 */
export interface FlowEditorStateProps {
    content: FlowContent;
    selection: FlowSelection | null;
    theme: FlowTheme;
    caret: TextStyle;
    undoStack: readonly FlowOperation[],
    redoStack: readonly FlowOperation[],
}

const Props = {
    content: lazyType(() => FlowContent.classType),
    selection: unionType(lazyType(FlowSelectionRegistry.close), nullType),
    theme: lazyType(FlowThemeRegistry.close),
    caret: TextStyle.classType,
    undoStack: operationStackType,
    redoStack: operationStackType,
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
                theme: DefaultFlowTheme.instance,
                caret: TextStyle.empty,
                undoStack: Object.freeze([]),
                redoStack: Object.freeze([]),
            });
        }
        return EMPTY_CACHE;
    }

    /**
     * Gets a uniform paragraph style from the current selection
     * @param diff - An optional set that is populated with style keys with non-uniform values
     */
    public getUniformParagraphStyle(diff?: Set<keyof ParagraphStyleProps>): ParagraphStyle {
        const { selection, content, theme } = this;
        if (selection === null) {
            return ParagraphStyle.empty;
        }
        return selection.getUniformParagraphStyle(content, theme, diff);
    }

    /**
     * Gets a uniform text style from the current selection
     * @param diff - An optional set that is populated with style keys with non-uniform values
     */
    public getUniformTextStyle(diff?: Set<keyof TextStyleProps>): TextStyle {
        const { selection, content, theme } = this;
        if (selection === null) {
            return TextStyle.empty;
        }
        return selection.getUniformTextStyle(content, theme, diff);
    }

    /**
     * Gets a new flow editor state, based on the current state, and with the specified
     * operation applied.
     * @param operation - The operation to apply
     * @param theme - Theme of the flow content
     */
    public applyMine(
        @type(lazyType(FlowOperationRegistry.close)) operation: FlowOperation,
    ): FlowEditorState {
        return this.#apply(operation, true);
    }

    /**
     * Gets a new flow editor state, based on the current state, and with the specified
     * operation applied.
     * @param operation - The operation to apply
     * @param theme - Theme of the flow content
     */
    public applyTheirs(
        @type(lazyType(FlowOperationRegistry.close)) operation: FlowOperation,
    ): FlowEditorState {
        return this.#apply(operation, false);
    }

    #apply(operation: FlowOperation, mine: boolean): FlowEditorState {
        const content = operation.applyToContent(this.content, this.theme);
        const selection = this.selection ? operation.applyToSelection(this.selection, mine) : null;
        const caret = !mine && selection ? this.caret : TextStyle.empty;
        return this.merge({ content, selection, caret });
    }
}

let EMPTY_CACHE: FlowEditorState | undefined;
