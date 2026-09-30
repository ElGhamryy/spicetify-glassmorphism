// Symlinks dist/Glass into Spicetify's Themes folder.
import { execFileSync } from "node:child_process";
import { existsSync, symlinkSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const cfg = execFileSync("spicetify", ["-c"], { encoding: "utf8" }).trim();
const target = join(dirname(cfg), "Themes", "Glass");
const source = resolve("dist/Glass");

if (!existsSync(source)) throw new Error("Run npm run build first.");
mkdirSync(dirname(target), { recursive: true });
if (existsSync(target)) {
  console.log(`Already exists: ${target}`);
} else {
  symlinkSync(source, target, "junction");
  console.log(`Linked ${target} -> ${source}`);
}
