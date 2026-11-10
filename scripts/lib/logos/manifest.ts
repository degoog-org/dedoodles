import { writeFile } from "node:fs/promises";
import { DEFAULT_BRANCH, LOGOS_FOLDER, MANIFEST_PATH, MANIFEST_VERSION, ROOT } from "../config/constants";
import type { Logo, Manifest, ManifestEntry } from "../config/types";

const _headCommit = (): string => {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;

  const run = Bun.spawnSync(["git", "-C", ROOT, "rev-parse", "HEAD"]);
  return run.exitCode === 0 ? run.stdout.toString().trim() : DEFAULT_BRANCH;
};

const _toEntry = (logo: Logo): ManifestEntry => ({
  id: logo.id,
  query: logo.query,
  title: logo.title,
  authors: logo.authors,
  image: `${LOGOS_FOLDER}/${logo.date}/${logo.id}/${logo.image}`,
});

export const timeLord = (logos: Logo[]): Manifest["logos"] => {
  const byDate: Manifest["logos"] = {};
  for (const logo of logos) (byDate[logo.date] ??= []).push(_toEntry(logo));

  return byDate;
};

export const buildManifest = (logos: Logo[]): Manifest => ({
  version: MANIFEST_VERSION,
  commit: _headCommit(),
  logos: timeLord(logos),
});

export const writeManifest = async (manifest: Manifest): Promise<void> =>
  writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
