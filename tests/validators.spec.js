import { describe, it, expect, vi } from "vitest";
import {
  required, minLength, maxLength, pattern, personName, email, peruPhone, document,
  totpCode, integer, numeric, min, max, strongPassword, minItems, notPast, timeAfter,
  validate, validateField, blockNonDigits,
} from "../src/Shared/domain/validation/validators.js";

describe("validators", () => {
  it("required rejects empty strings, whitespace, null and empty arrays", () => {
    const rule = required();
    for (const v of ["", "   ", null, undefined, []]) expect(rule(v)).toBeTypeOf("string");
    for (const v of ["a", 0, ["x"]]) expect(rule(v)).toBeNull();
  });

  it("optional rules accept empty values", () => {
    const rules = [minLength(3), maxLength(3), pattern(/x/), personName(), email(), peruPhone(),
      document(), totpCode(), integer(), numeric(), min(1), max(1), strongPassword()];
    for (const rule of rules) expect(rule("")).toBeNull();
  });

  it("length rules", () => {
    expect(minLength(2)("a")).not.toBeNull();
    expect(minLength(2)("ab")).toBeNull();
    expect(maxLength(3)("abcd")).not.toBeNull();
    expect(maxLength(3)("abc")).toBeNull();
  });

  it("personName allows letters, tildes, ñ and spaces only", () => {
    expect(personName()("José Peña Núñez")).toBeNull();
    expect(personName()("Juan123")).not.toBeNull();
    expect(personName()("Ana-María")).not.toBeNull();
  });

  it("email", () => {
    expect(email()("ana@mail.com")).toBeNull();
    expect(email()("ana@mail")).not.toBeNull();
    expect(email()("ana mail.com")).not.toBeNull();
  });

  it("peruPhone normalizes spaces and dashes", () => {
    for (const v of ["987654321", "51987654321", "+51987654321", "+51 987 654 321", "987-654-321"]) {
      expect(peruPhone()(v)).toBeNull();
    }
    for (const v of ["887654321", "98765432", "9876543210", "abc987654", "+52987654321"]) {
      expect(peruPhone()(v)).not.toBeNull();
    }
  });

  it("document and totpCode", () => {
    expect(document()("12345678")).toBeNull();
    expect(document()("123456789012")).toBeNull();
    expect(document()("1234567")).not.toBeNull();
    expect(document()("1234567890123")).not.toBeNull();
    expect(totpCode()("123456")).toBeNull();
    expect(totpCode()("12345a")).not.toBeNull();
  });

  it("numeric rules", () => {
    expect(integer()(5)).toBeNull();
    expect(integer()(5.5)).not.toBeNull();
    expect(numeric()("12.5")).toBeNull();
    expect(numeric()("abc")).not.toBeNull();
    expect(min(18)(17)).not.toBeNull();
    expect(min(18)(18)).toBeNull();
    expect(max(70)(71)).not.toBeNull();
    expect(max(70)(70)).toBeNull();
  });

  it("strongPassword requires 8+ chars with letters and numbers", () => {
    expect(strongPassword()("abcdefg1")).toBeNull();
    expect(strongPassword()("abcdefgh")).not.toBeNull();
    expect(strongPassword()("12345678")).not.toBeNull();
    expect(strongPassword()("abc1")).not.toBeNull();
  });

  it("minItems", () => {
    expect(minItems(1)([])).not.toBeNull();
    expect(minItems(1)(["a"])).toBeNull();
  });

  it("notPast handles dates and datetimes", () => {
    const now = () => new Date(2026, 8, 14, 12, 0);
    const rule = notPast(undefined, now);
    expect(rule("2026-09-13")).not.toBeNull();
    expect(rule("2026-09-14")).toBeNull();
    expect(rule("2026-09-14T11:59")).not.toBeNull();
    expect(rule("2026-09-14T12:30")).toBeNull();
  });

  it("timeAfter compares against another field", () => {
    const rule = timeAfter("startTime");
    expect(rule("10:00", { startTime: "09:00" })).toBeNull();
    expect(rule("09:00", { startTime: "09:00" })).not.toBeNull();
    expect(rule("08:00", { startTime: "09:00" })).not.toBeNull();
  });

  it("uses a custom message when given", () => {
    expect(required("Falta")("")).toBe("Falta");
  });

  it("validate returns only the first error of each invalid field", () => {
    const schema = { name: [required("req"), minLength(2, "short")], email: [email("bad")], phone: [peruPhone()] };
    expect(validate({ name: "", email: "x", phone: "" }, schema)).toEqual({ name: "req", email: "bad" });
    expect(validateField({ name: "a" }, schema, "name")).toBe("short");
    expect(validate({ name: "Ana", email: "a@b.co", phone: "" }, schema)).toEqual({});
  });

  it("blockNonDigits prevents letters but lets digits and Enter through", () => {
    const press = (key, extra = {}) => {
      const event = { key, preventDefault: vi.fn(), ...extra };
      blockNonDigits(event);
      return event.preventDefault.mock.calls.length > 0;
    };
    expect(press("a")).toBe(true);
    expect(press("+")).toBe(true);
    expect(press("7")).toBe(false);
    expect(press("Enter")).toBe(false);
    expect(press("v", { metaKey: true })).toBe(false);
  });
});
