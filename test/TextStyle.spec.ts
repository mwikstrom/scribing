import { TextStyle } from "../src";

describe("TextStyle", () => {
    it("can be extended", () => {
        const original = new TextStyle({bold: true, italic: true});
        const extended = original.merge({bold: false, underline: true});
        expect(extended.equals({bold: false, italic: true, underline: true})).toBe(true);
    });

    it("can be reduced", () => {
        const original = new TextStyle({bold: true, italic: true, strike: true});
        const reduced = original.unmerge({bold: false, italic: true, underline: true});
        expect(reduced.equals({bold: true, strike: true})).toBe(true);
    });

    it("can be reduced by keys only", () => {
        const original = new TextStyle({bold: true, italic: true});
        const reduced = original.unset("bold", "underline");
        expect(reduced.equals({italic: true})).toBe(true);
    });
});