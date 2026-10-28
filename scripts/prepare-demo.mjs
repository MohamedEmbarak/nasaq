import { cpSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const dest = resolve(root, "apps/playground/public");
mkdirSync(dest, { recursive: true });
rmSync(resolve(dest, "brand"), { recursive: true, force: true });
for (const entry of [
  "assets", "previews", "third-party", "brand.css", "fonts.css", "index.html",
  "README.md", "decision.json", "editable-wordmark.svg", "palette.json", "nasaq-brand-kit.zip",
]) {
  cpSync(resolve(root, "brand", entry), resolve(dest, "brand", entry), { recursive: true });
}
for (const file of ['LICENSE', 'NOTICE']) copyFileSync(resolve(root, file), resolve(dest, file));
copyFileSync(
  resolve(root, "brand/assets/favicon.svg"),
  resolve(dest, "favicon.svg"),
);
mkdirSync(resolve(dest, "licenses"), { recursive: true });
for (const [packagePath, name] of [
  ["@fontsource/ibm-plex-sans", "IBM-Plex-Sans"],
  ["@fontsource/ibm-plex-sans-arabic", "IBM-Plex-Sans-Arabic"],
  ["@fontsource-variable/inter", "Inter"],
]) {
  copyFileSync(
    resolve(root, "node_modules", packagePath, "LICENSE"),
    resolve(dest, "licenses", `${name}-OFL.txt`),
  );
}
