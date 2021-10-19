import { BoxStyle, FlowBox, FlowContent, TextRun, TextStyle } from "../src";

describe("FlowBox", () => {
    it("can serialize to json", () => {
        const button = new FlowBox({
            style: BoxStyle.empty,
            content: new FlowContent({
                nodes: Object.freeze([
                    new TextRun({ text: "foobar", style: TextStyle.empty }),
                ])
            })
        });
        const json = button.toJsonValue();
        expect(json).toMatchObject({
            box: ["foobar"]
        });
    });
});
