import { join, relative } from "node:path";
import { DATE_PATTERN, LOGOS_DIR, ROOT, SLUG_PATTERN, TEMPLATE_DIR } from "../config/constants";
import { marauderMap } from "../utils/fs";
import { isRealDate } from "../utils/guards";
import { inspectLogo } from "./inspect";
import type { Harvest, Logo, Report } from "../config/types";

const _reporter = (errors: string[]): Report => (path, messages) =>
  messages.forEach((message) => errors.push(`${relative(ROOT, path)}: ${message}`));

const _collectLogo = async (dateDir: string, date: string, id: string, report: Report): Promise<Logo[]> => {
  const logoDir = join(dateDir, id);

  if (!SLUG_PATTERN.test(id)) {
    report(logoDir, ["folder name must be lowercase words joined by dashes, e.g. comic-book-day"]);
    return [];
  }

  const errors: string[] = [];
  const logo = await inspectLogo(logoDir, date, id, errors);
  report(logoDir, errors);

  return logo && !errors.length ? [logo] : [];
};

const _collectDate = async (date: string, report: Report): Promise<Logo[]> => {
  const dateDir = join(LOGOS_DIR, date);

  if (!DATE_PATTERN.test(date) || !isRealDate(date)) {
    report(dateDir, ["folder name must be a real date as yyyymmdd"]);
    return [];
  }

  const { dirs: ids, files } = await marauderMap(dateDir);
  if (files.length) report(dateDir, [`files are not allowed here, put them in a logo folder: ${files.join(", ")}`]);
  if (!ids.length) report(dateDir, ["has no logo folders"]);

  const logos: Logo[] = [];
  for (const id of ids) logos.push(...(await _collectLogo(dateDir, date, id, report)));

  return logos;
};

export const gottaCatchEm = async (): Promise<Harvest> => {
  const logos: Logo[] = [];
  const errors: string[] = [];
  const report = _reporter(errors);

  const { dirs: dates, files: looseFiles } = await marauderMap(LOGOS_DIR);
  report(LOGOS_DIR, looseFiles.map((file) => `files are not allowed here: ${file}`));

  for (const date of dates) {
    if (date === TEMPLATE_DIR) continue;
    logos.push(...(await _collectDate(date, report)));
  }

  return { logos, errors };
};
