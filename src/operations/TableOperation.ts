import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowSelection } from "../selection/FlowSelection";
import { transformRangeAfterInsertFlow, transformRangeAfterRemoveFlow } from "../internal/transform-helpers";
import { FlowTable } from "../nodes/FlowTable";
import { FlowTableSelection } from "../selection/FlowTableSelection";
import { CellRange } from "../selection/CellRange";

/**
 * Represents an operation that updates a table node
 * @public
 * @sealed
 */
export abstract class TableOperation extends FlowOperation {
    /** Position of the table node */
    public abstract readonly position: number;

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(content: FlowContent): FlowOperation | null {
        const { position } = this;
        const { node } = content.peek(position);
        if (node instanceof FlowTable) {
            return this.invertForTable(node);
        } else {
            return null;
        }
    }

    /** @internal */
    protected abstract invertForTable(table: FlowTable): FlowOperation | null;

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(next: FlowOperation): FlowOperation | null {
        if (next instanceof TableOperation && next.position === this.position) {
            return this.mergeNextInSameTable(next);
        } else {
            return null;
        }
    }

    /** @internal */
    protected abstract mergeNextInSameTable(next: TableOperation): FlowOperation | null;

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(other: FlowOperation): FlowOperation | null {
        if (other instanceof TableOperation && other.position === this.position) {
            return this.transformInSameTable(other);
        } else {
            return other;
        }
    }

    /** @internal */
    protected abstract transformInSameTable(other: TableOperation): FlowOperation | null;

    /**
     * {@inheritDoc FlowOperation.applyToContent}
     * @override
     */
    applyToContent(content: FlowContent): FlowContent {
        const { position} = this;
        const { node } = content.peek(position);
        if (node instanceof FlowTable) {
            const newTable = this.applyToTable(node);
            return content.replace(FlowRange.at(position, 1), newTable);
        } else {
            return content;
        }
    }

    /** @internal */
    protected abstract applyToTable(table: FlowTable): FlowTable;

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(selection: FlowSelection, mine: boolean): FlowSelection | null {
        if (selection instanceof FlowTableSelection && selection.position === this.position) {
            const updated = this.applyToCellRange(selection.range, mine);
            return updated ? selection.set("range", updated) : null;
        }
        // Does not affect selection
        return selection;
    }

    /** @internal */
    protected abstract applyToCellRange(range: CellRange, mine: boolean): CellRange | null;

    /** 
     * {@inheritDoc FlowOperation.afterInsertFlow}
     */
    afterInsertFlow(range: FlowRange): FlowOperation | null {
        const before = FlowRange.at(this.position, 1);
        const after = transformRangeAfterInsertFlow(before, range);
        return this.#wrapPosition(after);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoveFlow}
     */
    afterRemoveFlow(range: FlowRange): FlowOperation | null {
        const before = FlowRange.at(this.position, 1);
        const after = transformRangeAfterRemoveFlow(before, range);
        return this.#wrapPosition(after);
    }

    /**
     * Returns a copy of the current object with the specified property merged in
     *
     * @param key - Key of the property to merge in
     * @param value - Property value to merge in
     *
     * @remarks
     * If the resulting object would be equal to the current instance, then the current
     * instance is returned instead.
     */
    public abstract set(key: "position", value: number): this;

    #wrapPosition(range: FlowRange | null): FlowOperation | null {
        if (range && range.size === 1) {
            return this.set("position", range.first);
        } else {
            return null;
        }
    }
}
