import { enumType, Type } from "paratype";

/**
 * Style variants
 * @public
 */
export type StyleVariant = (typeof STYLE_VARIANTS)[number];

/**
 * Read-only array that contains all style variants
 * @public
 */
export const STYLE_VARIANTS = Object.freeze([
    "normal",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "title",
    "subtitle",
    "preamble",
    "code",
] as const);

/**
 * The run-time type that matches style variant values
 * @public
 */
export const StyleVariantType: Type<StyleVariant> = enumType(STYLE_VARIANTS);
