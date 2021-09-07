import { FlowNode, ParagraphBreak, TextRun } from "../src";

describe("FlowNode", () => {
    it("can deserialize plain text run", () => {
        const node = FlowNode.fromJsonValue("foobar") as TextRun;
        expect(node).toBeInstanceOf(TextRun);
        expect(node.text).toBe("foobar");
        expect(node.style.isEmpty).toBe(true);
    });

    it("can deserialize styled text run", () => {
        const node = FlowNode.fromJsonValue({
            text: "foobar",
            style: { bold: true }
        }) as TextRun;
        expect(node).toBeInstanceOf(TextRun);
        expect(node.text).toBe("foobar");
        expect(node.style.toData()).toMatchObject({ bold: true });
    });

    it("can deserialize plain paragraph break", () => {
        const node = FlowNode.fromJsonValue({ break: "para" }) as ParagraphBreak;
        expect(node).toBeInstanceOf(ParagraphBreak);
        expect(node.style.isEmpty).toBe(true);
    });

    it("can deserialize styled paragraph break", () => {
        const node = FlowNode.fromJsonValue({
            break: "para",
            style: { alignment: "center" }
        }) as ParagraphBreak;
        expect(node).toBeInstanceOf(ParagraphBreak);
        expect(node.style.toData()).toMatchObject({ alignment: "center" });
    });
});