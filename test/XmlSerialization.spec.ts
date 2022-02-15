import fs from "fs";
import path from "path";
import { FlowContent, serializeFlowContentToXml } from "../src";

describe("XmlSerialization", () => {
    const inputDir = path.join(__dirname, "./XmlSerialization");
    fs.readdirSync(inputDir).forEach(fileName => {
        if (/\.json$/i.test(fileName)) {
            it(`can convert ${fileName} to XML`, () => {
                const jsonPath = path.join(inputDir, fileName);
                const xmlPath = jsonPath.replace(/\.json$/i, ".xml");
                const json = fs.readFileSync(jsonPath, { encoding: "utf-8" });
                const raw = fs.readFileSync(xmlPath, { encoding: "utf-8" });
                const expected = raw
                    .replace(/^<\?xml-model.*$/gm, "")
                    .replace(/\r\n/g, "\n")
                    .trim();
                const parsed = FlowContent.fromJsonValue(JSON.parse(json));
                const actual = serializeFlowContentToXml(parsed);
                console.log(actual.replace(/ /g, "_"));
                console.log(expected.replace(/ /g, "_"));
                expect(actual).toBe(expected);
            });
        }
    });
});