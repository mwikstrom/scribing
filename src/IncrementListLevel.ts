import { 
    frozen, 
    integerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    type, 
    validating
} from "paratype";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection } from "./FlowSelection";
import { FlowTheme } from "./FlowTheme";
import { FlowOperationRegistry } from "./internal/class-registry";
import { 
    transformEdgeInflatingRangeOpAfterInsertion, 
    transformRangeOpAfterRemoval
} from "./internal/transform-helpers";

const Props = {
    range: FlowRange.classType,
    delta: integerType,
};

const Data = {
    range: Props.range,
    list: integerType,
};

const PropsType: RecordType<IncrementListLevelProps> = recordType(Props);
const DataType: RecordType<IncrementListLevelData> = recordType(Data);
const propsToData = ({range, delta}: IncrementListLevelProps): IncrementListLevelData => ({ list: delta, range });

/**
 * The base record class for {@link IncrementListLevel}
 * @public
 */
export const IncrementListLevelBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of increment list level operations
 * @public
 */
export interface IncrementListLevelProps {
    /** The range that shall be formatted */
    range: FlowRange;

    /** The list level delta change */
    delta: number;
}

/**
 * Data of format increment list level operations
 * @public
 */
export interface IncrementListLevelData extends Pick<IncrementListLevelProps, "range"> {
    /** The list level delta change */
    list: number;
}

/**
 * Represents an operation that applies a paragraph style to a range of flow content.
 * @sealed
 * @public
 */
@frozen
@validating
@FlowOperationRegistry.register
export class IncrementListLevel extends IncrementListLevelBase implements Readonly<IncrementListLevelProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => IncrementListLevel);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: IncrementListLevelData): IncrementListLevel {
        const { range, list } = data;
        const props: IncrementListLevelProps = { range, delta: list };
        return new IncrementListLevel(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(): FlowOperation | null {
        const { range, delta } = this;
        return new IncrementListLevel({ range, delta: -delta });
    }

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(other: FlowOperation): FlowOperation | null {
        // Formatting does not affect other operation
        return other;
    }

    /**
     * {@inheritDoc FlowOperation.applyToContent}
     * @override
     */
    applyToContent(content: FlowContent, theme?: FlowTheme): FlowContent {
        return content.incrementListLevel(this.range, this.delta, theme);
    }

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(selection: FlowSelection): FlowSelection {
        // Formatting does not affect selection
        return selection;
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertion}
     */
    afterInsertion(other: FlowRange): FlowOperation | null {
        return transformEdgeInflatingRangeOpAfterInsertion(this, other);
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoval}
     */
    afterRemoval(other: FlowRange): FlowOperation | null {
        return transformRangeOpAfterRemoval(this, other);
    }
}
