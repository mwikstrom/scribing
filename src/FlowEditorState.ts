import { 
    arrayType, 
    booleanType, 
    frozen, 
    lazyType, 
    nullType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    unionType, 
    validating 
} from "paratype";
import { ParagraphStyleProps, TextStyleProps } from ".";
import { DefaultFlowTheme } from "./DefaultFlowTheme";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowSelection } from "./FlowSelection";
import { FlowTheme } from "./FlowTheme";
import { FlowOperationRegistry, FlowSelectionRegistry, FlowThemeRegistry } from "./internal/class-registry";
import { filterNotNull, mapNotNull } from "./internal/utils";
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
    undoStack: readonly FlowOperation[];
    redoStack: readonly FlowOperation[];
    formattingMarks: boolean;
}

/**
 * Data for {@link FlowEditorState}
 * @public
 */
export interface FlowEditorStateData 
extends Partial<Omit<FlowEditorStateProps, "selection" | "undoStack" | "redoStack">> {
    selection?: FlowSelection;
    undo?: readonly FlowOperation[],
    redo?: readonly FlowOperation[],
}

const Props = {
    content: lazyType(() => FlowContent.classType),
    selection: unionType(lazyType(FlowSelectionRegistry.close), nullType),
    theme: lazyType(FlowThemeRegistry.close),
    caret: TextStyle.classType,
    undoStack: operationStackType,
    redoStack: operationStackType,
    formattingMarks: booleanType,
};

const Data = {
    content: Props.content,
    selection: lazyType(FlowSelectionRegistry.close),
    theme: Props.theme,
    caret: Props.caret,
    undo: Props.undoStack,
    redo: Props.redoStack,
    formattingMarks: Props.formattingMarks,
};

const PropsType: RecordType<FlowEditorStateProps> = recordType(Props);
const DataType: RecordType<FlowEditorStateData> = recordType(Data).asPartial();

const propsToData = (props: FlowEditorStateProps): FlowEditorStateData => {
    const { 
        content, 
        selection, 
        theme, 
        caret, 
        undoStack, 
        redoStack,
        formattingMarks,
    } = props;
    const data: FlowEditorStateData = {};
    
    if (content.nodes.length > 0) {
        data.content = content;
    }

    if (selection !== null) {
        data.selection = selection;
    }

    if (theme !== DefaultFlowTheme.instance) {
        data.theme = theme;
    }

    if (!caret.isEmpty) {
        data.caret = caret;
    }

    if (undoStack.length > 0) {
        data.undo = undoStack;
    }

    if (redoStack.length > 0) {
        data.redo = redoStack;
    }

    if (formattingMarks) {
        data.formattingMarks = formattingMarks;
    }

    return data;
};

/**
 * The base record class for {@link FlowEditorState}
 * @public
 */
export const FlowEditorStateBase = RecordClass(PropsType, Object, DataType, propsToData);

/**
 * Options for the {@link FlowEditorState.applyMine} method
 * @public
 */
export interface ApplyMineOptions {
    mergeUndo?: boolean;
}

/**
 * Immutable state record for a flow content editor
 * @public
 * @sealed
 */
@frozen
@validating 
export class FlowEditorState extends FlowEditorStateBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowEditorState);

    /**
     * Gets a flow range from the specified data
     * @param data - A tuple with two values, the first is the anchor position and the second is the
     *               focus position
     */
    public static fromData(@type(DataType) data: FlowEditorStateData): FlowEditorState {
        const {
            content,
            selection,
            theme,
            caret,
            undo: undoStack,
            redo: redoStack,
            formattingMarks,
        } = data;

        return FlowEditorState.empty.merge({
            content,
            selection,
            theme,
            caret,
            undoStack,
            redoStack,
            formattingMarks,
        });
    }

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
                formattingMarks: false,
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
     * @param options - Optional options that control how the operation is applied.
     */
    public applyMine(
        @type(lazyType(FlowOperationRegistry.close)) operation: FlowOperation,
            options?: ApplyMineOptions,
    ): FlowEditorState {
        return this.#apply(operation, true, options);
    }

    /**
     * Gets a new flow editor state, based on the current state, and with the specified
     * operation applied.
     * @param operation - The operation to apply
     */
    public applyTheirs(
        @type(lazyType(FlowOperationRegistry.close)) operation: FlowOperation,
    ): FlowEditorState {
        return this.#apply(operation, false);
    }

    /** Toggles whether formatting symbols are shown */
    public toggleFormattingMarks(): FlowEditorState {
        return this.set("formattingMarks", !this.formattingMarks);
    }

    /** Undoes the most recent operation */
    public undo(): FlowEditorState {
        const { undoStack: [operation] } = this;
        return operation ? this.#apply(operation, "undo") : this;
    }

    /** Redoes the most recent undone operation */
    public redo(): FlowEditorState {
        const { redoStack: [operation] } = this;
        return operation ? this.#apply(operation, "redo") : this;
    }

    #apply(
        operation: FlowOperation,
        mine: boolean | "undo" | "redo",
        options: ApplyMineOptions = {},
    ): FlowEditorState {
        const content = operation.applyToContent(this.content, this.theme);
        const selection = this.selection ? operation.applyToSelection(this.selection, !!mine) : null;
        const caret = !mine && selection ? this.caret : TextStyle.empty;
        let undoStack: readonly FlowOperation[];
        let redoStack: readonly FlowOperation[];

        if (!mine) {
            undoStack = Object.freeze(mapNotNull(this.undoStack, op => operation.transform(op)));
            redoStack = Object.freeze(mapNotNull(this.redoStack, op => operation.transform(op)));
        } else if (mine === "undo" && operation === this.undoStack[0]) {
            undoStack = Object.freeze(this.undoStack.slice(1));
            redoStack = Object.freeze(filterNotNull([
                operation.invert(this.content), 
                ...this.redoStack.slice(0, MAX_UNDO_LENGTH - 1)
            ]));
        } else {
            const inverted = operation.invert(this.content);

            if (inverted === null) {
                undoStack = this.undoStack;
            } else {
                const merged = options.mergeUndo && this.undoStack.length > 0 ?
                    inverted.mergeNext(this.undoStack[0]) :
                    null;

                const keep = merged !== null ? 
                    this.undoStack.slice(1) : 
                    this.undoStack.slice(0, MAX_UNDO_LENGTH - 1);

                undoStack = Object.freeze([merged ?? inverted, ...keep]);
            }

            if (mine === "redo" && operation === this.redoStack[0]) {
                redoStack = Object.freeze(this.redoStack.slice(1));
            } else {
                redoStack = Object.freeze([]);
            }            
        }

        return this.merge({ content, selection, caret, undoStack, redoStack });
    }
}

let EMPTY_CACHE: FlowEditorState | undefined;
const MAX_UNDO_LENGTH = 200;
