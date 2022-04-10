import { unionType, stringType, Type, customClassType } from "paratype";
import { Script } from "../structure/Script";

/** @public */
export type AttrValue = (
    string |
    Script
);

const scriptValueType = customClassType(
    Script,
    (...args) => Script.fromData(Script.dataType.fromJsonValue(...args)),
    (value, ...rest) => {
        const json = Script.dataType.toJsonValue(value.toData(), ...rest);
        if (typeof json === "string") {
            return { code: json };
        }
        return json;
    },
);

/** @public */
export const attrValueType: Type<AttrValue> = unionType(
    stringType,
    scriptValueType,
);
