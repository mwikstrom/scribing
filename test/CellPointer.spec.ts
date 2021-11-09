import { CellPointer } from "../src/CellPointer";

describe("CellPointer", () => {
    it("can parse A1", () => {
        const parsed = CellPointer.fromData("A1");
        expect(parsed.row).toBe(0);
        expect(parsed.column).toBe(0);
    });

    it("can format A1", () => {
        expect(new CellPointer({ row: 0, column: 0}).toString()).toBe("A1");
    });

    it("can parse DF45", () => {
        const parsed = CellPointer.fromData("DF45");
        expect(parsed.row).toBe(44);
        expect(parsed.column).toBe(109);
    });

    it("can format DF45", () => {
        expect(new CellPointer({ row: 44, column: 109}).toString()).toBe("DF45");
    });

    it("can parse ABC123", () => {
        const parsed = CellPointer.fromData("ABC123");
        expect(parsed.row).toBe(122);
        expect(parsed.column).toBe(730);
    });

    it("can format ABC123", () => {
        expect(new CellPointer({ row: 122, column: 730}).toString()).toBe("ABC123");
    });
});