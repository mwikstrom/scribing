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
}

const Props = {
    url: stringType,
    width: positiveIntegerType,
    height: positiveIntegerType,
};

const PropsType = recordType(Props);

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
