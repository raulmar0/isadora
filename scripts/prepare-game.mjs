import { existsSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

const games = [
  {
    source: "qui-est-ce",
    destination: "quiestce",
    label: "Qui est-ce ?",
  },
  {
    source: "pays-nationalites",
    destination: "pays",
    label: "Pays et nationalités",
  },
];

function npmEnv() {
  // npm 11 rejects this global-install setting when inherited as an env var
  // by a project install. Keep the user's .npmrc policy in effect instead.
  const env = { ...process.env };
  delete env.npm_config_allow_scripts;
  delete env.NPM_CONFIG_ALLOW_SCRIPTS;
  return env;
}

async function prepareGame({ source, destination, label }) {
  const game = join(root, source);
  const target = join(root, "public", destination);

  if (!existsSync(join(game, "package.json"))) {
    throw new Error(`No se encuentra el código del juego en ${source}/.`);
  }

  if (!existsSync(join(game, "node_modules", "vite", "bin", "vite.js"))) {
    execFileSync("npm", ["ci"], { cwd: game, env: npmEnv(), stdio: "inherit" });
  }

  execFileSync("npm", ["run", "build"], { cwd: game, stdio: "inherit" });

  if (!existsSync(join(game, "dist", "index.html"))) {
    throw new Error(`La compilación de ${label} no produjo dist/index.html.`);
  }

  await mkdir(join(root, "public"), { recursive: true });
  await rm(target, { recursive: true, force: true });
  await cp(join(game, "dist"), target, { recursive: true });
  console.log(`${label} está disponible en /${destination}/`);
}

for (const game of games) {
  await prepareGame(game);
}
