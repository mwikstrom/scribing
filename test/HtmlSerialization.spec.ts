import fs from "fs";
import path from "path";
import { FlowContent } from "../src/structure/FlowContent";
import { serializeFlowContentToHtml } from "../src/serialize/serialize-html";

describe("HtmlSerialization", () => {
    const inputDir = path.join(__dirname, "./HtmlSerialization");
    fs.readdirSync(inputDir).forEach(fileName => {
        if (/\.json$/i.test(fileName)) {
            it(`can convert ${fileName} to HTML`, async () => {
                const jsonPath = path.join(inputDir, fileName);
                const xmlPath = jsonPath.replace(/\.json$/i, ".html");
                const json = fs.readFileSync(jsonPath, { encoding: "utf-8" });
                const raw = fs.readFileSync(xmlPath, { encoding: "utf-8" });
                const expected = raw
                    .replace(/\r\n/g, "\n")
                    .trim();
                const parsed = FlowContent.fromJsonValue(JSON.parse(json));
                const actual = await serializeFlowContentToHtml(parsed);
                expect(actual).toBe(expected);
            });
        }
    });
});