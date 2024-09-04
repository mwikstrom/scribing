import { 
    positiveIntegerType,
    RecordClass,
    recordClassType,
    recordType,
    stringType,
} from "paratype";

/**
 * Properties of {@link VideoSource}
 * @public
 */
export interface VideoSourceProps {
    /** URL to the video */
    url: string;

    /** Video width (in pixels) */
    width: number;

    /** Video height (in pixels) */
    height: number;

    /** URL to an image to display before the video is downloaded */
    poster?: string;

    /** Placeholder bitmap data (base64 encoded), to be shown before the poster is downloaded */
    placeholder?: string;

    /** Identifies an upload operation that will replace this video source */
    upload?: string;
}

const Props = {
    url: stringType,
    poster: stringType,
    width: positiveIntegerType,
    height: positiveIntegerType,
    placeholder: stringType,
    upload: stringType,
};

const PropsType = recordType(Props).withOptional("placeholder", "poster", "upload");

/**
 * The base record class for {@link VideoSource}
 * @public
 */
export const VideoSourceBase = RecordClass(PropsType);

/**
 * Represents the source of a {@link FlowVideo}
 * 
 * @public
 * @sealed
 */
export class VideoSource extends VideoSourceBase implements Readonly<VideoSourceProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => VideoSource);
}
