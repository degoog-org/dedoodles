import { readdir } from "node:fs/promises";
import type { Listing } from "../config/types";

export const marauderMap = async (dir: string): Promise<Listing> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const visible = entries.filter((entry) => !entry.name.startsWith("."));

  return {
    dirs: visible.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort(),
    files: visible.filter((entry) => !entry.isDirectory()).map((entry) => entry.name).sort(),
  };
};
