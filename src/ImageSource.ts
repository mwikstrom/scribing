import { 
    frozen,
    positiveIntegerType,
    RecordClass,
    recordClassType,
    recordType,
    stringType,
    validating
} from "paratype";

/**
 * Properties of {@link ImageSource}
 * @public
 */
export interface ImageSourceProps {
    /** URL to the image */
    url: string;

    /** Preferred image with (in pixels) */
    width: number;

    /** Preferred image height (in pixels) */
    height: number;

    /** Placeholder bitmap data (base64 encoded) */
    placeholder?: string;
}

const Props = {
    url: stringType,
    width: positiveIntegerType,
    height: positiveIntegerType,
    placeholder: stringType,
};

const PropsType = recordType(Props).withOptional("placeholder");

/**
 * The base record class for {@link ImageSource}
 * @public
 */
export const ImageSourceBase = RecordClass(PropsType);

/**
 * Represents the source of a {@link FlowImage}
 * 
 * @public
 * @sealed
 */
@frozen
@validating
export class ImageSource extends ImageSourceBase implements Readonly<ImageSourceProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => ImageSource);
}
