import { 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    tupleType, 
    Type, 
} from "paratype";

const Props = {
    anchor: nonNegativeIntegerType,
    focus: nonNegativeIntegerType,
};
const PropsType: RecordType<FlowRangeProps> = recordType(Props);
const DataType: Type<FlowRangeTuple> = tupleType(Props.anchor, Props.focus);
const propsToData = ({anchor, focus}: FlowRangeProps): FlowRangeTuple => ([ anchor, focus ]);

/**
 * The base record class for {@link FlowRange}
 * @public
 */
export const FlowRangeBase =  RecordClass(PropsType, Object, DataType, propsToData);

/**
 * Non-computed properties of a {@link FlowRange}
 * @public
 */
export interface FlowRangeProps {
    /**
     * The anchor point marks the beginning of a selection range.
     */
    anchor: number;

    /**
     * The focus point marks the ending of a selection range.
     */
    focus: number;
}

/**
 * Data for a {@link FlowRange} represented by a tuple where the first value is the
 * anchor position and the second value is the focus position.
 * @public
 */
export type FlowRangeTuple = [number, number];

/**
 * Represents a range of flow content
 * @public
 * @sealed
 */
export class FlowRange extends FlowRangeBase implements Readonly<FlowRangeProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowRange);

    /**
     * Gets a flow range from the specified data
     * @param data - A tuple with two values, the first is the anchor position and the second is the
     *               focus position
     */
    public static fromData(data: FlowRangeTuple): FlowRange {
        const [anchor, focus] = data;
        const props: FlowRangeProps = { anchor, focus };
        return new FlowRange(props);
    }

    /**
     * Gets a flow range with the specified anchor and optionally with a distance.
     * @param position - Anchor position
     * @param distance - Optional. Range distance. Can be negative. Default is zero.
     * @returns 
     */
    public static at(position: number, distance = 0): FlowRange {
        return FlowRange.fromData([position, position + distance]);
    }

    /** Gets the first position */
    public get first(): number { return  Math.min(this.anchor, this.focus); }

    /** Gets the last position */
    public get last(): number { return  Math.max(this.anchor, this.focus); }

    /** Gets the distance from anchor to focus, which may be a negative value */
    public get distance(): number { return this.focus - this.anchor; }

    /** Gets the size of the range, which is the absolute value of its distance */
    public get size(): number { return  Math.abs(this.focus - this.anchor); }

    /** Determines whether the focus position is after the anchor position */
    public get isBackward(): boolean { return this.anchor > this.focus; }

    /** Determines whether the range is collapsed. This is true when anchor and focus are equal. */
    public get isCollapsed(): boolean { return this.anchor === this.focus; }

    /** Determines whether the specified position is within the current range */
    public contains(position: number): boolean {
        return this.first <= position && this.last > position;
    }

    /**
     * Reduces the distance of the current range by the specified delta
     * @param delta - The delta distance
     */
    public deflate(delta: number): FlowRange {
        return this.inflate(-delta);
    }

    /**
     * Increases the distance of the current range by the specified delta
     * @param delta - The delta distance
     */
    public inflate(delta: number): FlowRange {
        const { anchor, focus, isBackward } = this;
        if (isBackward) {
            return this.set("anchor", anchor + delta);
        } else {
            return this.set("focus", focus + delta);
        }
    }

    /**
     * Gets a range that represents the intersection between the current range
     * and the specified other range.
     * @param other - The other range
     */
    public intersect(other: FlowRange): FlowRange {
        if (other.last <= this.first) {
            return FlowRange.at(this.first);
        } else if (other.first >= this.last) {
            return FlowRange.at(this.last);
        }

        const intersection = new FlowRange({
            anchor: Math.max(this.first, other.first),
            focus: Math.min(this.last, other.last),
        });

        if (this.isBackward) {
            return intersection.reverse();
        } else {
            return intersection;
        }
    }

    /** Gets a range that represents the reverse of the current range */
    public reverse(): FlowRange {
        const { anchor, focus } = this;
        return this.merge({ anchor: focus, focus: anchor });
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
    public set(key: "first" | "last" | keyof FlowRangeProps, value: number): this {
        if (key === "first") {
            key = this.isBackward ? "focus" : "anchor";
        } else if (key === "last") {
            key = this.isBackward ? "anchor" : "focus";
        }
        return super.set(key, value);
    }

    /** Gets a string representation of the current range */
    public toString(): string {
        return `[${this.anchor},${this.focus}]`;
    }

    /**
     * Moves the position of the current range by the specified delta
     * @param delta - The delta distance
     */
    public translate(delta: number): FlowRange {
        let { anchor, focus } = this;
        anchor += delta;
        focus += delta;
        return new FlowRange({ anchor, focus});
    }
}
