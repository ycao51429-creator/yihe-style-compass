import { build } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { writeFileSync } from "node:fs";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(project, "docs");
if (path.dirname(output) !== project || path.basename(output) !== "docs") throw new Error("Invalid Pages output directory");
await build({
  configFile: false,
  root: path.join(project, "pages"),
  base: "./",
  publicDir: path.join(project, "public"),
  plugins: [react()],
  define: { __YIHE_STATIC__: "true" },
  build: { outDir: output, emptyOutDir: true, target: "es2020", sourcemap: false },
});
writeFileSync(path.join(output, ".nojekyll"), "");
