import fs from "node:fs";
import path from "node:path";

const messagesDir = path.resolve("src/messages");
const files = fs.readdirSync(messagesDir).filter((f) => f.endsWith(".json"));
const sets = {};

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(messagesDir, file), "utf8"));
  const keys = new Set();
  const walk = (obj, prefix = "") => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) walk(v, key);
      else keys.add(key);
    }
  };
  walk(data);
  sets[file] = keys;
}

const all = new Set([...Object.values(sets).flatMap((s) => [...s])]);
let ok = true;
for (const file of files) {
  const missing = [...all].filter((k) => !sets[file].has(k));
  if (missing.length) {
    ok = false;
    console.error(`Missing keys in ${file}:\n  ${missing.join("\n  ")}`);
  }
}
if (!ok) process.exit(1);
console.log(`i18n parity OK across ${files.join(", ")} (${all.size} keys).`);
