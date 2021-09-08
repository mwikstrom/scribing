import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";

/**
 * Abstraction for operations that updates a flow range
 * @public
 */
export abstract class UpdateRange extends FlowOperation {
    abstract readonly range: FlowRange;

    abstract set(key: "range", value: FlowRange): this;

    /**
     * {@inheritDoc FlowOperation.afterInsertion}
     * @override
     */
    afterInsertion(other: FlowRange): this {
        // Translated when insertion was made before or at start
        if (other.first <= this.range.first) {
            return this.set("range", this.range.translate(other.size));
        }

        // Inflated when insertion was made inside
        if (other.first < this.range.last) {
            return this.set("range", this.range.inflate(other.size));
        }
        
        // Otherwise, unaffected
        return this;
    }

    /**
     * {@inheritDoc FlowOperation.afterRemoval}
     * @override
     */
    afterRemoval(other: FlowRange): this | null {
        let { range } = this;

        // Unaffected when removal was made at or after end
        if (other.first >= range.last) {
            return this;
        }

        // Deflated when removal insersect with this
        const intersection = range.intersect(other); 
        if (intersection.size > 0) {
            range = range.deflate(intersection.size);

            // Cancelled when deflated to nothing
            if (range.isCollapsed) {
                return null;
            }
        }       

        // Translated when removal was made before start
        if (other.first < range.first) {
            range = range.translate(intersection.size - other.size);
        }

        return this.set("range", range);
    }
}