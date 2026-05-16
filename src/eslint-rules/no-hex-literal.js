// Custom ESLint rule: disallow #RRGGBB / #RGB literals in code, except inside lib/brand.ts.
// CommonJS so eslint can require it directly.
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "No hex color literals outside /lib/brand.ts" },
    schema: [],
    messages: {
      noHex: "No hex literals ('{{value}}'). Use brand tokens from @/lib/brand.",
    },
  },
  create(context) {
    const file = context.filename ?? context.getFilename();
    const normalized = file.replaceAll("\\", "/");
    if (
      normalized.endsWith("/src/lib/brand.ts") ||
      normalized.endsWith("/tests/unit/brand.test.ts")
    )
      return {};
    return {
      Literal(node) {
        if (typeof node.value === "string" && HEX.test(node.value)) {
          context.report({ node, messageId: "noHex", data: { value: node.value } });
        }
      },
      TemplateElement(node) {
        const raw = node.value?.cooked ?? "";
        const match = raw.match(/#(?:[0-9a-fA-F]{3,8})\b/);
        if (match) {
          context.report({ node, messageId: "noHex", data: { value: match[0] } });
        }
      },
    };
  },
};
