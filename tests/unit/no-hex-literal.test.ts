import { describe, it } from "vitest";
import { RuleTester } from "eslint";
// @ts-expect-error - CommonJS rule module
import rule from "../../src/eslint-rules/no-hex-literal.js";

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

describe("no-hex-literal", () => {
  it("runs RuleTester suite", () => {
    ruleTester.run("no-hex-literal", rule as Parameters<typeof ruleTester.run>[1], {
      valid: [
        // Allowlisted source-of-truth file
        { filename: "/repo/src/lib/brand.ts", code: 'export const c = "#225560";' },
        // Allowlisted contract test
        { filename: "/repo/tests/unit/brand.test.ts", code: 'expect("#225560").toBe("#225560");' },
        // Non-hex strings — should not flag
        { filename: "/repo/src/components/Foo.tsx", code: 'const s = "hello world";' },
        // URL with a fragment anchor that isn't a valid hex length — should not flag
        {
          filename: "/repo/src/components/Foo.tsx",
          code: 'const u = "https://example.com/docs#section";',
        },
        // 4-char and 5-char and 7-char hex-LIKE strings — should not flag (only 3/6/8 are colors)
        { filename: "/repo/src/components/Foo.tsx", code: 'const s = "#abcd";' },
        { filename: "/repo/src/components/Foo.tsx", code: 'const s = "#abcde";' },
        { filename: "/repo/src/components/Foo.tsx", code: 'const s = "#abcdefg";' },
      ],
      invalid: [
        // 6-char hex in a regular file — must flag
        {
          filename: "/repo/src/components/Foo.tsx",
          code: 'const c = "#225560";',
          errors: [{ messageId: "noHex" }],
        },
        // 3-char hex — must flag
        {
          filename: "/repo/src/components/Foo.tsx",
          code: 'const c = "#abc";',
          errors: [{ messageId: "noHex" }],
        },
        // 8-char hex (with alpha) — must flag
        {
          filename: "/repo/src/components/Foo.tsx",
          code: 'const c = "#225560FF";',
          errors: [{ messageId: "noHex" }],
        },
        // Hex inside a template literal — must flag
        {
          filename: "/repo/src/components/Foo.tsx",
          code: "const c = `color: #225560;`;",
          errors: [{ messageId: "noHex" }],
        },
      ],
    });
  });
});
