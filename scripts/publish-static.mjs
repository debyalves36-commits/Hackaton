import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const build = new URL("dist/", root);
const html = readFileSync(new URL("index.html", build), "utf8");
if (!html.includes("./assets/") || html.includes("/src/main.tsx")) {
  throw new Error("Execute npm run build antes de preparar a publicação estática.");
}
// Only copy generated files. Application source and local data remain untouched.
// Keep previous fingerprinted assets so cached pages continue to load during deploys.
for (const path of ["assets", "logo.svg", "products", "index.html"]) {
  const source = new URL(path, build);
  if (!existsSync(source)) throw new Error(`Arquivo do build ausente: ${path}`);
  cpSync(source, new URL(path, root), { recursive: true });
}
writeFileSync(new URL(".nojekyll", root), "");
console.log(`Build estático preparado em ${fileURLToPath(root)}`);
