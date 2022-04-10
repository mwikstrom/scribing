import { 
    positiveIntegerType,
    RecordClass,
    recordClassType,
    recordType,
    stringType,
} from "paratype";

/**
 * Properties of {@link ImageSource}
 * @public
 */
export interface ImageSourceProps {
    /** URL to the image */
    url: string;

    /** Preferred image width (in pixels) */
    width: number;

    /** Preferred image height (in pixels) */
    height: number;

    /** Placeholder bitmap data (base64 encoded) */
    placeholder?: string;

    /** Identifies an upload operation that will replace this image source */
    upload?: string;
}

const Props = {
    url: stringType,
    width: positiveIntegerType,
    height: positiveIntegerType,
    placeholder: stringType,
    upload: stringType,
};

const PropsType = recordType(Props).withOptional("placeholder", "upload");

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
export class ImageSource extends ImageSourceBase implements Readonly<ImageSourceProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => ImageSource);
}
