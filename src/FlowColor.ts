import { enumType, Type } from "paratype";

/**
 * Flow content color
 * @public
 */
export type FlowColor = (typeof FLOW_COLORS)[number];

/**
 * Read-only array that contains all flow content colors
 * @public
 */
export const FLOW_COLORS = Object.freeze([
    "default",
    "subtle",
    "primary",
    "secondary",
    "information",
    "success",
    "warning",
    "error",
] as const);

/**
 * The run-time type that matches text color values
 * @public
 */
export const FlowColorType: Type<FlowColor> = enumType(FLOW_COLORS);
