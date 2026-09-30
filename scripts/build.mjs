import { mkdirSync, copyFileSync, writeFileSync, watch } from "node:fs";
import { compile } from "sass";
import { build, context } from "esbuild";

const out = "dist/Glass";
const tmp = "dist/.tmp/theme.js";
const watching = process.argv.includes("--watch");

function css() {
  mkdirSync(out, { recursive: true });
  const { css } = compile("src/scss/user.scss", { style: watching ? "expanded" : "compressed" });
  writeFileSync(`${out}/user.css`, css);
  console.log("user.css");
}

function ini() {
  mkdirSync(out, { recursive: true });
  copyFileSync("src/color.ini", `${out}/color.ini`);
  console.log("color.ini");
}

// esbuild deletes and recreates its output file, and `spicetify watch` exits fatally if theme.js
// is missing for a moment. Build to a temp file and overwrite the real one in place instead.
const copyTheme = {
  name: "copy-theme",
  setup(b) {
    b.onEnd((result) => {
      if (result.errors.length) return;
      mkdirSync(out, { recursive: true });
      copyFileSync(tmp, `${out}/theme.js`);
      console.log("theme.js");
    });
  },
};

const jsOptions = {
  entryPoints: ["src/ts/theme.ts"],
  bundle: true,
  format: "iife",
  target: "es2020",
  minify: !watching,
  outfile: tmp,
  plugins: [copyTheme],
};

css();
ini();

const guard = (fn) => () => {
  try {
    fn();
  } catch (e) {
    console.error(e.message);
  }
};

if (watching) {
  const ctx = await context(jsOptions);
  await ctx.watch();
  watch("src/scss", { recursive: true }, guard(css));
  watch("src/color.ini", guard(ini));
  console.log("watching src/");
} else {
  await build(jsOptions);
}
