import { ParagraphStyle } from "../src";

describe("ParagraphStyle", () => {
    it("can be extended", () => {
        const original = new ParagraphStyle({alignment: "start", direction: "ltr"});
        const extended = original.merge({alignment: "center", variant: "h1"});
        expect(extended.equals({alignment: "center", direction: "ltr", variant: "h1"})).toBe(true);
    });

    it("can be reduced", () => {
        const original = new ParagraphStyle({alignment: "center", direction: "ltr", lineSpacing: 100});
        const reduced = original.unmerge({alignment: "end", direction: "ltr", variant: "h1"});
        expect(reduced.equals({alignment: "center", lineSpacing: 100})).toBe(true);
    });

    it("can be reduced by keys only", () => {
        const original = new ParagraphStyle({alignment: "center", direction: "ltr"});
        const reduced = original.unset("alignment", "variant");
        expect(reduced.equals({direction: "ltr"})).toBe(true);
    });
});
