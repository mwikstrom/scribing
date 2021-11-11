import { 
    frozen, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    stringType, 
    type, 
    validating 
} from "paratype";
import { FlowContent } from "../structure/FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowOperationRegistry } from "../internal/class-registry";

const Props = {
    id: stringType,
    url: stringType,
};

const Data = {
    complete_upload: stringType,
    url: stringType,
};

const PropsType: RecordType<CompleteUploadProps> = recordType(Props);
const DataType: RecordType<CompleteUploadData> = recordType(Data);
const propsToData = ({id, url }: CompleteUploadProps): CompleteUploadData => ({
    complete_upload: id,
    url,
});

/**
 * The base record class for {@link CompleteUpload}
 * @public
 */
export const CompleteUploadBase = RecordClass(PropsType, FlowOperation, DataType, propsToData);

/**
 * Properties of {@link CompleteUpload}
 * @public
 */
export interface CompleteUploadProps {
    /** Identifies the completed upload operation */
    id: string;

    /** URL for the uploaded content */
    url: string;
}

/**
 * Data of {@link CompleteUpload}
 * @public
 */
export interface CompleteUploadData {
    /** {@inheritdoc CompleteUploadProps.id} */
    complete_upload: string;

    /** {@inheritdoc CompleteUploadProps.url} */
    url: string;
}

/**
 * Represents an operation that completes an upload
 * @public
 * @sealed
 */
@frozen
@validating
@FlowOperationRegistry.register
export class CompleteUpload extends CompleteUploadBase implements CompleteUploadProps {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => CompleteUpload);

    /** Gets an instance of the current class from the specified data */
    public static fromData(@type(DataType) data: CompleteUploadData): CompleteUpload {
        const { complete_upload: id, url } = data;
        const props: CompleteUploadProps = { id, url };
        return new CompleteUpload(props);
    }

    /**
     * {@inheritDoc FlowOperation.invert}
     * @override
     */
    invert(): null {
        // NOTE: This operation could be inverted, but I think
        // it's more reasonable to not allow it, since the upload
        // itself is already completed and that cannot be inverted.
        // I'm willing to change that thinking though :-)
        return null;
    }

    /**
     * {@inheritdoc FlowOperation.mergeNext}
     */
    mergeNext(): null {
        // Cannot be merged
        return null;
    }

    /**
     * {@inheritDoc FlowOperation.transform}
     * @override
     */
    transform(other: FlowOperation): FlowOperation | null {
        // Does not affect other operation
        return other;
    }

    /**
     * {@inheritDoc FlowOperation.applyToContent}
     * @override
     */
    applyToContent(content: FlowContent): FlowContent {
        const { id, url } = this;
        return content.completeUpload(id, url);
    }

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(selection: FlowSelection): FlowSelection {
        // Does not affect selection
        return selection;
    }

    /** 
     * {@inheritDoc FlowOperation.afterInsertFlow}
     */
    afterInsertFlow(): this {
        // Applies to all content and is therefore not affected by other insertion
        return this;
    }

    /** 
     * {@inheritDoc FlowOperation.afterRemoveFlow}
     */
    afterRemoveFlow(): this {
        // Applies to all content and is therefore not affected by other removal
        return this;
    }
}
