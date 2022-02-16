import fs from "fs";
import path from "path";
import { FlowContent } from "../src/structure/FlowContent";
import { deserializeFlowContentFromXml } from "../src/xml/deserialize-flowdoc";
import { serializeFlowContentToXml } from "../src/xml/serialize-flowdoc";

describe("XmlSerialization", () => {
    const inputDir = path.join(__dirname, "./XmlSerialization");
    fs.readdirSync(inputDir).forEach(fileName => {
        if (/\.json$/i.test(fileName)) {
            it(`can convert ${fileName} to XML`, () => {
                const jsonPath = path.join(inputDir, fileName);
                const xmlPath = jsonPath.replace(/(\.norm)?\.json$/i, ".xml");
                const json = fs.readFileSync(jsonPath, { encoding: "utf-8" });
                const raw = fs.readFileSync(xmlPath, { encoding: "utf-8" });
                const expected = raw
                    .replace(/^<\?xml-model.*$/gm, "")
                    .replace(/\r\n/g, "\n")
                    .trim();
                const parsed = FlowContent.fromJsonValue(JSON.parse(json));
                const actual = serializeFlowContentToXml(parsed);
                expect(actual).toBe(expected);
            });
        } else if (/\.xml$/i.test(fileName)) {
            it(`can convert ${fileName} to JSON`, () => {
                const xmlPath = path.join(inputDir, fileName);
                let jsonPath = xmlPath.replace(/\.xml$/i, ".norm.json");
                if (!fs.existsSync(jsonPath)) {
                    jsonPath = xmlPath.replace(/\.xml$/i, ".json");
                }
                const xml = fs.readFileSync(xmlPath, { encoding: "utf-8" });
                const expected = JSON.parse(fs.readFileSync(jsonPath, { encoding: "utf-8" }));
                const deserialized = deserializeFlowContentFromXml(xml);
                const actual = deserialized.toJsonValue();
                expect(actual).toMatchObject(expected);
            });
        }
    });
});