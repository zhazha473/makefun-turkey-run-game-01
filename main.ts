// Gobble Run — the hand-in program (Node 22, standard library only).
// It copies the game's static files and its screenshots into the output
// directory and writes dossier.json with the vendored make.fun library,
// exactly the dossier the scorer rebuilds and compares byte for byte.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader sets /output itself and runs this program twice; both runs
// must write identical bytes, so nothing here depends on the clock,
// the network or the order the filesystem happens to list files in.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The caps are the gate's own: the text cap shapes the dossier bytes,
// the rest refuse an entry the scorer would refuse anyway (more than
// 4 screenshots or one over 256 KiB; game/ past 993 entries or 48 MiB
// in all; a game path over 1,000 bytes).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
