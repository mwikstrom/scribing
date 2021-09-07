import { TextRun } from "../src";

describe("TextRun", () => {
    it("newline character is replaced when normalizing content", () => {
        const input = "foo\nbar";
        const output = "foo�bar";
        expect(TextRun.normalizeText(input)).toBe(output);
    });

    it("normal whitespace is kept when normalizing content", () => {
        const input = " foo  bar ";
        const output = input;
        expect(TextRun.normalizeText(input)).toBe(output);
    });

    it("normalizes to NFC", () => {
        expect(TextRun.normalizeText("Am\u0065\u0301lie")).toBe("Amélie");
    });
});
