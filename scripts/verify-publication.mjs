import { readFileSync } from "node:fs";

const inputUrl = process.env.SITE_URL;
if (!inputUrl || new URL(inputUrl).protocol !== "https:") throw new Error("SITE_URL deve ser o endereço HTTPS publicado.");
const url = inputUrl.endsWith("/") ? inputUrl : `${inputUrl}/`;
const expected = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const script = expected.match(/<script\b[^>]*\bsrc="([^"]+)"/i)?.[1];
if (!script) throw new Error("O build não contém o módulo da aplicação.");
let lastError;
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}release=${Date.now()}`, { signal: AbortSignal.timeout(15000) });
    const html = await response.text();
    if (!response.ok || !html.includes(script) || html.includes("/src/main.tsx")) {
      throw new Error(`O site ainda não serve este build (HTTP ${response.status}).`);
    }
    for (const path of [script, "./logo.svg", "./products/chicken.svg", "./products/pork.svg"]) {
      const asset = await fetch(new URL(path, url), { signal: AbortSignal.timeout(15000) });
      if (!asset.ok) throw new Error(`Arquivo publicado indisponível: ${path}, HTTP ${asset.status}`);
      const body = await asset.text();
      if (/^<!doctype html/i.test(body.trimStart())) throw new Error(`Arquivo retornou HTML em vez do conteúdo esperado: ${path}`);
    }
    console.log(`Site público validado: ${url}; HTML, JavaScript, logo e produto respondem corretamente.`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < 11) await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
throw lastError;
