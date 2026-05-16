const esbuild = require("esbuild");
const production = process.argv.includes("production");

esbuild
  .build({
    entryPoints: ["main.ts"],
    bundle: true,
    outfile: "main.js",
    external: ["obsidian"],
    format: "cjs",
    target: "es2018",
    platform: "browser",
    sourcemap: production ? false : "inline",
    minify: production,
  })
  .catch(() => process.exit(1));
