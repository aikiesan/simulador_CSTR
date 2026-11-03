// Loads the Anatomy kit once for every figure, and the build's language and theme from the command line.
// Drawn with the Anatomy kit (github.com/wheresryan22/anatomy, MIT), vendored in vendor/anatomy; ANATOMY_DIR points elsewhere.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ANATOMY = process.env.ANATOMY_DIR || resolve(HERE, "..", "vendor", "anatomy");
const KIT_URL = pathToFileURL(join(ANATOMY, "kit", "iso-kit.mjs")).href;
export const k = await import(KIT_URL);
export const G = await import(pathToFileURL(join(ANATOMY, "kit", "lathe.mjs")).href);
export const A = await import(pathToFileURL(join(ANATOMY, "kit", "audit.mjs")).href);
export const TB = await import(pathToFileURL(join(ANATOMY, "kit", "tube.mjs")).href);
export const { kitScript } = await import(pathToFileURL(join(ANATOMY, "scripts", "inline-kit.mjs")).href);
export const SHELL_SRC = readFileSync(join(HERE, "shell.mjs"), "utf8");
export const SH = await import("data:text/javascript," + encodeURIComponent(SHELL_SRC.replace("__KIT__", KIT_URL)));
export const MODEL_SRC = readFileSync(join(HERE, "model.mjs"), "utf8");

export const theme = process.argv.includes("--light") ? "light" : "dark";
export const lang = process.argv.includes("--pt") ? "pt" : "en";
export const L = lang === "pt" ? 1 : 0;
export const DEG = Math.PI / 180;
export const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;");
