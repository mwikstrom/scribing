import { Script } from "../src/structure/Script";

describe("Script", () => {
    describe("isFormattableMessage", () => {
        test.each`
            message
            ${"plain"}
            ${"{arg}"}
            ${"{arg, plural, zero {Zero} =10 {Ten} other {#}}"}
            ${"{arg, selectordinal, offset:1 zero {Zero} =10 {Ten} other {#}}"}
            ${"{arg, select, x {X} y {Y} other {{arg}}}"}
            ${"'{' {S, plural, other{# is a '#'}} '}'"}
        `("returns true for $message", ({message}) => {
            expect(Script.isSupportedMessageFormat(message)).toBe(true);
        });

        test.each`
            message
            ${"mal{formed"}
            ${"{arg}"}
            ${"{}"}
            ${"{arg, plural, zero {No other}}"}
            ${"{arg, plural, bad {Bad} other {}}"}
            ${"{arg, plural, 123 {No EQ} other {}}"}
            ${"{arg, selectordinal, offset:bad other {#}}"}
            ${"{arg, select, other {#}}"}
            ${"{arg, date}"}
            ${"{arg, time}"}
            ${"{arg, time, short}"}
            ${"{arg, duration}"}
            ${"{arg, number, integer}"}
        `("returns false for $message", message => {
            expect(Script.isSupportedMessageFormat(message)).toBe(false);
        });
    });
});