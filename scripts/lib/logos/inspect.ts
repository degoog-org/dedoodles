import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { checkAuthors } from "../checks/authors";
import { checkImage } from "../checks/image";
import { checkTitle } from "../checks/title";
import { LOGO_KEYS, MAX_QUERY_LENGTH, REQUIRED_FILES } from "../config/constants";
import { LogoFile } from "../config/enums";
import { marauderMap } from "../utils/fs";
import { isRecord, isText } from "../utils/guards";
import { unknownKeys } from "../utils/helpers";
import type { Listing, Logo } from "../config/types";

const _checkLayout = ({ dirs, files }: Listing, errors: string[]): void => {
  for (const required of REQUIRED_FILES) {
    if (!files.includes(required)) errors.push(`"${required}" is missing`);
  }

  if (dirs.length) errors.push(`sub-folders are not allowed: ${dirs.join(", ")}`);
};

const _parseLogo = async (dir: string, errors: string[]): Promise<Record<string, unknown> | null> => {
  let data: unknown;

  try {
    data = JSON.parse(await readFile(join(dir, LogoFile.Json), "utf8"));
  } catch (err) {
    errors.push(`"${LogoFile.Json}" is not valid JSON: ${(err as Error).message}`);
    return null;
  }

  if (!isRecord(data)) {
    errors.push(`"${LogoFile.Json}" must be an object`);
    return null;
  }

  return data;
};

const _checkFields = (data: Record<string, unknown>, errors: string[]): void => {
  const unknown = unknownKeys(data, LOGO_KEYS);
  if (unknown.length) errors.push(`"${LogoFile.Json}" has unknown fields: ${unknown.join(", ")}`);

  if (!isText(data.query, MAX_QUERY_LENGTH)) {
    errors.push(`"query" must be text up to ${MAX_QUERY_LENGTH} characters`);
  }
};

const _checkStray = (files: string[], image: unknown, errors: string[]): void => {
  const expected = new Set([...REQUIRED_FILES, String(image)]);
  const stray = files.filter((file) => !expected.has(file));

  if (stray.length) errors.push(`unexpected files: ${stray.join(", ")}`);
};

export const inspectLogo = async (
  dir: string,
  date: string,
  id: string,
  errors: string[],
): Promise<Logo | null> => {
  const listing = await marauderMap(dir);
  _checkLayout(listing, errors);
  if (!listing.files.includes(LogoFile.Json)) return null;

  const data = await _parseLogo(dir, errors);
  if (!data) return null;

  _checkFields(data, errors);
  const title = checkTitle(data.title, errors);
  const authors = checkAuthors(data.authors, errors);
  await checkImage(dir, data.image, errors);
  _checkStray(listing.files, data.image, errors);

  if (!title || typeof data.query !== "string" || typeof data.image !== "string") return null;

  return { date, id, query: data.query.trim(), title, authors, image: data.image };
};
