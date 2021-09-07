import { FlowRange } from "../src";

describe("FlowRange", () => {
    it("can be empty", () => {
        const r = FlowRange.at(123);
        expect(r.anchor).toBe(123);
        expect(r.focus).toBe(123);
        expect(r.first).toBe(123);
        expect(r.last).toBe(123);
        expect(r.distance).toBe(0);
        expect(r.size).toBe(0);
        expect(r.isBackward).toBe(false);
        expect(r.isCollapsed).toBe(true);
        expect(String(r)).toBe("[123,123]");

        expect(r.contains(122)).toBe(false);
        expect(r.contains(123)).toBe(false);
        expect(r.contains(124)).toBe(false);

        const inflated = r.inflate(10);
        expect(inflated.anchor).toBe(123);
        expect(inflated.focus).toBe(133);
        expect(inflated.deflate(10).equals(r)).toBe(true);
    });

    it("can be fowrard", () => {
        const r = FlowRange.at(123, 333);
        expect(r.anchor).toBe(123);
        expect(r.focus).toBe(456);
        expect(r.first).toBe(123);
        expect(r.last).toBe(456);
        expect(r.distance).toBe(333);
        expect(r.size).toBe(333);
        expect(r.isBackward).toBe(false);
        expect(r.isCollapsed).toBe(false);
        expect(String(r)).toBe("[123,456]");

        expect(r.contains(122)).toBe(false);
        expect(r.contains(123)).toBe(true);
        expect(r.contains(124)).toBe(true);
        expect(r.contains(455)).toBe(true);
        expect(r.contains(456)).toBe(false);

        const inflated = r.inflate(10);
        expect(inflated.anchor).toBe(123);
        expect(inflated.focus).toBe(466);
        expect(inflated.deflate(10).equals(r)).toBe(true);
    });

    it("can be reversed", () => {
        const r = FlowRange.at(456, -333);
        expect(r.anchor).toBe(456);
        expect(r.focus).toBe(123);
        expect(r.first).toBe(123);
        expect(r.last).toBe(456);
        expect(r.distance).toBe(-333);
        expect(r.size).toBe(333);
        expect(r.isBackward).toBe(true);
        expect(r.isCollapsed).toBe(false);
        expect(String(r)).toBe("[456,123]");

        expect(r.contains(122)).toBe(false);
        expect(r.contains(123)).toBe(true);
        expect(r.contains(124)).toBe(true);
        expect(r.contains(455)).toBe(true);
        expect(r.contains(456)).toBe(false);

        const inflated = r.inflate(10);
        expect(inflated.anchor).toBe(466);
        expect(inflated.focus).toBe(123);
        expect(inflated.deflate(10).equals(r)).toBe(true);
    });

    it("can be translated", () => {
        expect(FlowRange.at(10).translate(5).equals(FlowRange.at(15))).toBe(true);
        expect(FlowRange.at(10).translate(-5).equals(FlowRange.at(5))).toBe(true);
        expect(FlowRange.at(10, 10).translate(5).equals(FlowRange.at(15, 10))).toBe(true);
        expect(FlowRange.at(10, 10).translate(-5).equals(FlowRange.at(5, 10))).toBe(true);
    });

    it("can be intersected", () => {
        const a = FlowRange.at(0, 10);
        const b = FlowRange.at(5, 10);
        const c = FlowRange.at(10, 10);
        const x = FlowRange.at(7);
        const y = FlowRange.at(5, 25);
        const z = FlowRange.at(30, -25);

        const [
            aa, ab, ac, ax, ay, az,
            ba, bb, bc, bx, by, bz,
            ca, cb, cc, cx, cy, cz, 
            xa, xb, xc, xx, xy, xz,
            ya, yb, yc, yx, yy, yz,
            za, zb, zc, zx, zy, zz,
        ] = [a, b, c, x, y, z].flatMap(r1 => [a, b, c, x, y, z].map(r2 => r1.intersect(r2)));

        expect(aa.equals(FlowRange.at(0, 10))).toBe(true);
        expect(ab.equals(FlowRange.at(5, 5))).toBe(true);
        expect(ac.equals(FlowRange.at(10))).toBe(true);
        expect(ax.equals(FlowRange.at(7))).toBe(true);
        expect(ay.equals(FlowRange.at(5, 5))).toBe(true);
        expect(az.equals(FlowRange.at(5, 5))).toBe(true);

        expect(ba.equals(FlowRange.at(5, 5))).toBe(true);
        expect(bb.equals(FlowRange.at(5, 10))).toBe(true);
        expect(bc.equals(FlowRange.at(10, 5))).toBe(true);
        expect(bx.equals(FlowRange.at(7))).toBe(true);
        expect(by.equals(FlowRange.at(5, 10))).toBe(true);
        expect(bz.equals(FlowRange.at(5, 10))).toBe(true);

        expect(ca.equals(FlowRange.at(10))).toBe(true);
        expect(cb.equals(FlowRange.at(10, 5))).toBe(true);
        expect(cc.equals(FlowRange.at(10, 10))).toBe(true);
        expect(cx.equals(FlowRange.at(10))).toBe(true);
        expect(cy.equals(FlowRange.at(10, 10))).toBe(true);
        expect(cz.equals(FlowRange.at(10, 10))).toBe(true);

        expect(xa.equals(FlowRange.at(7))).toBe(true);
        expect(xb.equals(FlowRange.at(7))).toBe(true);
        expect(xc.equals(FlowRange.at(7))).toBe(true);
        expect(xx.equals(FlowRange.at(7))).toBe(true);
        expect(xy.equals(FlowRange.at(7))).toBe(true);
        expect(xz.equals(FlowRange.at(7))).toBe(true);

        expect(ya.equals(FlowRange.at(5, 5))).toBe(true);
        expect(yb.equals(FlowRange.at(5, 10))).toBe(true);
        expect(yc.equals(FlowRange.at(10, 10))).toBe(true);
        expect(yx.equals(FlowRange.at(7))).toBe(true);
        expect(yy.equals(FlowRange.at(5, 25))).toBe(true);
        expect(yz.equals(FlowRange.at(5, 25))).toBe(true);

        expect(za.equals(FlowRange.at(10, -5))).toBe(true);
        expect(zb.equals(FlowRange.at(15, -10))).toBe(true);
        expect(zc.equals(FlowRange.at(20, -10))).toBe(true);
        expect(zx.equals(FlowRange.at(7))).toBe(true);
        expect(zy.equals(FlowRange.at(30, -25))).toBe(true);
        expect(zz.equals(FlowRange.at(30, -25))).toBe(true);
    });
});
