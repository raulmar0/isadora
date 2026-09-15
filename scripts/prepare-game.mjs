import { existsSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const game = join(root, "qui-est-ce");
// This directory is generated from the game source on every portal build.
const destination = join(root, "public", "quiestce");

if (!existsSync(join(game, "package.json"))) {
  throw new Error("No se encuentra el código del juego en qui-est-ce/.");
}

if (!existsSync(join(game, "node_modules", "vite", "bin", "vite.js"))) {
  // npm 11 rejects this global-install setting when inherited as an env var
  // by a project install. Keep the user's .npmrc policy in effect instead.
  const env = { ...process.env };
  delete env.npm_config_allow_scripts;
  delete env.NPM_CONFIG_ALLOW_SCRIPTS;
  execFileSync("npm", ["ci"], { cwd: game, env, stdio: "inherit" });
}

execFileSync("npm", ["run", "build"], { cwd: game, stdio: "inherit" });

if (!existsSync(join(game, "dist", "index.html"))) {
  throw new Error("La compilación del juego no produjo dist/index.html.");
}

await mkdir(join(root, "public"), { recursive: true });
await rm(destination, { recursive: true, force: true });
await cp(join(game, "dist"), destination, { recursive: true });
console.log("Qui est-ce ? está disponible en /quiestce/");
