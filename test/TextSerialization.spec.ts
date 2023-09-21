import fs from "fs";
import path from "path";
import { FlowContent, serializeFlowContentToText } from "../src";

describe("TextSerialization", () => {
    const inputDir = path.join(__dirname, "./TextSerialization");
    fs.readdirSync(inputDir).forEach(fileName => {
        if (/\.json$/i.test(fileName)) {
            it(`can convert ${fileName} to plain text`, () => {
                const jsonPath = path.join(inputDir, fileName);
                const textPath = jsonPath.replace(/\.json$/i, ".txt");
                const json = fs.readFileSync(jsonPath, { encoding: "utf-8" });
                const text = fs.readFileSync(textPath, { encoding: "utf-8" });
                const expected = text.replace(/\r\n/g, "\n");
                const parsed = FlowContent.fromJsonValue(JSON.parse(json));
                const actual = serializeFlowContentToText(parsed);
                expect(actual).toBe(expected);
            });
        }
    });
});