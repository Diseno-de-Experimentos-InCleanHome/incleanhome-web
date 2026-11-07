import { describe, expect, it } from "vitest";
import { renderSafeMarkdown } from "../src/Shared/infrastructure/markdown.js";

describe("renderSafeMarkdown", () => {
  it("conserva Markdown válido y elimina HTML ejecutable", () => {
    const html = renderSafeMarkdown("# Términos\n\n**Vigentes** <img src=x onerror=alert(1)> <a href=\"javascript:alert(1)\">enlace</a>");

    expect(html).toContain("<h1>Términos</h1>");
    expect(html).toContain("<strong>Vigentes</strong>");
    expect(html).not.toMatch(/onerror|javascript:/i);
  });
});
