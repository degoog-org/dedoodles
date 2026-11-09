import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { collectLogos, type Author } from "./validate";

type ManifestEntry = {
  id: string;
  query: string;
  title: Record<string, string>;
  authors: Author[];
  image: string;
};

const ROOT = join(import.meta.dir, "..");
const MANIFEST_PATH = join(ROOT, "manifest.json");
const MANIFEST_VERSION = 1;

const _currentCommit = (): string => {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  const run = Bun.spawnSync(["git", "-C", ROOT, "rev-parse", "HEAD"]);
  return run.exitCode === 0 ? run.stdout.toString().trim() : "main";
};

const { logos, errors } = await collectLogos();
if (errors.length) {
  console.error("Cannot build the manifest, run `bun scripts/validate.ts` to see what is wrong.");
  process.exit(1);
}

const byDate: Record<string, ManifestEntry[]> = {};
for (const logo of logos) {
  (byDate[logo.date] ??= []).push({
    id: logo.id,
    query: logo.query,
    title: logo.title,
    authors: logo.authors,
    image: `logos/${logo.date}/${logo.id}/${logo.image}`,
  });
}

const manifest = {
  version: MANIFEST_VERSION,
  commit: _currentCommit(),
  logos: byDate,
};

await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote manifest.json with ${logos.length} logo${logos.length === 1 ? "" : "s"}.`);
