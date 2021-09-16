import { 
    frozen, 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    tupleType, 
    type, 
    Type, 
    validating, 
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
 */
@frozen
@validating
export class FlowRange extends FlowRangeBase implements Readonly<FlowRangeProps> {
    /** A run-time type that matches {@link FlowRange} instances */
    public static readonly classType = recordClassType(() => FlowRange);

    /**
     * Gets a flow range from the specified data
     * @param data - A tuple with two values, the first is the anchor position and the second is the
     *               focus position
     */
    public static fromData(@type(DataType) data: FlowRangeTuple): FlowRange {
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
    public static at(@type(nonNegativeIntegerType) position: number, distance = 0): FlowRange {
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

    public deflate(distance: number): FlowRange {
        return this.inflate(-distance);
    }

    public inflate(distance: number): FlowRange {
        const { anchor, focus, isBackward } = this;
        if (isBackward) {
            return this.set("anchor", anchor + distance);
        } else {
            return this.set("focus", focus + distance);
        }
    }

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

    public reverse(): FlowRange {
        const { anchor, focus } = this;
        return this.merge({ anchor: focus, focus: anchor });
    }

    public set(key: "first" | "last" | keyof FlowRangeProps, value: number): this {
        if (key === "first") {
            key = this.isBackward ? "focus" : "anchor";
        } else if (key === "last") {
            key = this.isBackward ? "anchor" : "focus";
        }
        return super.set(key, value);
    }

    public toString(): string {
        return `[${this.anchor},${this.focus}]`;
    }

    public translate(distance: number): FlowRange {
        let { anchor, focus } = this;
        anchor += distance;
        focus += distance;
        return new FlowRange({ anchor, focus});
    }
}
