import { FlowButton, FlowContent, TextRun, TextStyle } from "../src";

describe("FlowButton", () => {
    it("can serialize to json", () => {
        const button = new FlowButton({
            action: null,
            content: new FlowContent({
                nodes: Object.freeze([
                    new TextRun({ text: "foobar", style: TextStyle.empty }),
                ])
            })
        });
        const json = button.toJsonValue();
        expect(json).toMatchObject({
            button: ["foobar"]
        });
    });
});
