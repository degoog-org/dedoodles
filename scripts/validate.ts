import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export type Author = { name: string; url?: string };

export type Logo = {
  date: string;
  id: string;
  query: string;
  title: Record<string, string>;
  authors: Author[];
  image: string;
};

const ROOT = join(import.meta.dir, "..");
const LOGOS_DIR = join(ROOT, "logos");
const TEMPLATE_DIR = "_template";
const DATE_PATTERN = /^\d{8}$/;
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LOCALE_PATTERN = /^[a-z]{2,3}(-[A-Z]{2})?$/;
const DEFAULT_LOCALE = "en-US";
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_QUERY_LENGTH = 200;
const MAX_TITLE_LENGTH = 120;
const MAX_NAME_LENGTH = 80;
const ALLOWED_KEYS = new Set(["$schema", "query", "title", "authors", "image"]);
const REQUIRED_FILES = ["logo.json", "README.md"];

const IMAGE_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) => _ascii(b, 0, 4) === "RIFF" && _ascii(b, 8, 12) === "WEBP",
  avif: (b) => _ascii(b, 4, 8) === "ftyp" && _ascii(b, 8, 12).startsWith("avi"),
};

const IMAGE_PATTERN = new RegExp(`^image\\.(${Object.keys(IMAGE_SIGNATURES).join("|")})$`);

const _ascii = (bytes: Uint8Array, from: number, to: number): string =>
  String.fromCharCode(...bytes.subarray(from, to));

const _isRealDate = (date: string): boolean => {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

const _isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const _isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const _isText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

const _listDirs = async (dir: string): Promise<{ dirs: string[]; files: string[] }> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const visible = entries.filter((entry) => !entry.name.startsWith("."));
  return {
    dirs: visible.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort(),
    files: visible.filter((entry) => !entry.isDirectory()).map((entry) => entry.name).sort(),
  };
};

const _checkTitle = (title: unknown, errors: string[]): Record<string, string> | null => {
  if (!_isRecord(title)) {
    errors.push(`"title" must be an object like { "${DEFAULT_LOCALE}": "Happy ..." }`);
    return null;
  }
  if (!(DEFAULT_LOCALE in title)) errors.push(`"title" needs an "${DEFAULT_LOCALE}" entry`);
  for (const [locale, text] of Object.entries(title)) {
    if (!LOCALE_PATTERN.test(locale)) errors.push(`"title" has an invalid locale "${locale}"`);
    if (!_isText(text, MAX_TITLE_LENGTH)) {
      errors.push(`"title.${locale}" must be text up to ${MAX_TITLE_LENGTH} characters`);
    }
  }
  return title as Record<string, string>;
};

const _checkAuthors = (authors: unknown, errors: string[]): Author[] => {
  if (!Array.isArray(authors) || authors.length === 0) {
    errors.push(`"authors" must list at least one author`);
    return [];
  }
  return authors.flatMap((author, index): Author[] => {
    if (!_isRecord(author)) {
      errors.push(`"authors[${index}]" must be an object with a "name"`);
      return [];
    }
    const extra = Object.keys(author).filter((key) => key !== "name" && key !== "url");
    if (extra.length) errors.push(`"authors[${index}]" has unknown fields: ${extra.join(", ")}`);
    if (!_isText(author.name, MAX_NAME_LENGTH)) {
      errors.push(`"authors[${index}].name" must be text up to ${MAX_NAME_LENGTH} characters`);
    }
    if (author.url !== undefined && !(typeof author.url === "string" && _isHttpsUrl(author.url))) {
      errors.push(`"authors[${index}].url" must be an https link`);
    }
    return [{ name: String(author.name), ...(typeof author.url === "string" ? { url: author.url } : {}) }];
  });
};

const _checkImage = async (dir: string, image: unknown, errors: string[]): Promise<void> => {
  if (typeof image !== "string" || !IMAGE_PATTERN.test(image)) {
    errors.push(`"image" must be one of ${Object.keys(IMAGE_SIGNATURES).map((ext) => `image.${ext}`).join(", ")}`);
    return;
  }
  const path = join(dir, image);
  const info = await stat(path).catch(() => null);
  if (!info?.isFile()) {
    errors.push(`"${image}" is missing`);
    return;
  }
  if (info.size > MAX_IMAGE_BYTES) {
    errors.push(`"${image}" is ${Math.ceil(info.size / 1024)} KB, the limit is ${MAX_IMAGE_BYTES / 1024} KB`);
  }
  const extension = image.slice(image.lastIndexOf(".") + 1);
  const bytes = new Uint8Array(await readFile(path)).subarray(0, 16);
  if (!IMAGE_SIGNATURES[extension]?.(bytes)) {
    errors.push(`"${image}" is not a real .${extension} file`);
  }
};

const _readLogo = async (dir: string, date: string, id: string, errors: string[]): Promise<Logo | null> => {
  const { dirs, files } = await _listDirs(dir);
  for (const required of REQUIRED_FILES) {
    if (!files.includes(required)) errors.push(`"${required}" is missing`);
  }
  if (dirs.length) errors.push(`sub-folders are not allowed: ${dirs.join(", ")}`);
  if (!files.includes("logo.json")) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(join(dir, "logo.json"), "utf8"));
  } catch (err) {
    errors.push(`"logo.json" is not valid JSON: ${(err as Error).message}`);
    return null;
  }
  if (!_isRecord(raw)) {
    errors.push(`"logo.json" must be an object`);
    return null;
  }

  const unknown = Object.keys(raw).filter((key) => !ALLOWED_KEYS.has(key));
  if (unknown.length) errors.push(`"logo.json" has unknown fields: ${unknown.join(", ")}`);
  if (!_isText(raw.query, MAX_QUERY_LENGTH)) {
    errors.push(`"query" must be text up to ${MAX_QUERY_LENGTH} characters`);
  }
  const title = _checkTitle(raw.title, errors);
  const authors = _checkAuthors(raw.authors, errors);
  await _checkImage(dir, raw.image, errors);

  const expected = new Set([...REQUIRED_FILES, String(raw.image)]);
  const stray = files.filter((file) => !expected.has(file));
  if (stray.length) errors.push(`unexpected files: ${stray.join(", ")}`);

  if (!title || typeof raw.query !== "string" || typeof raw.image !== "string") return null;
  return { date, id, query: raw.query.trim(), title, authors, image: raw.image };
};

export const collectLogos = async (): Promise<{ logos: Logo[]; errors: string[] }> => {
  const logos: Logo[] = [];
  const errors: string[] = [];
  const report = (path: string, messages: string[]) =>
    messages.forEach((message) => errors.push(`${relative(ROOT, path)}: ${message}`));

  const { dirs: dates, files: looseFiles } = await _listDirs(LOGOS_DIR);
  report(LOGOS_DIR, looseFiles.map((file) => `files are not allowed here: ${file}`));

  for (const date of dates) {
    if (date === TEMPLATE_DIR) continue;
    const dateDir = join(LOGOS_DIR, date);
    if (!DATE_PATTERN.test(date) || !_isRealDate(date)) {
      report(dateDir, ["folder name must be a real date as yyyymmdd"]);
      continue;
    }
    const { dirs: ids, files } = await _listDirs(dateDir);
    if (files.length) report(dateDir, [`files are not allowed here, put them in a logo folder: ${files.join(", ")}`]);
    if (!ids.length) report(dateDir, ["has no logo folders"]);

    for (const id of ids) {
      const logoDir = join(dateDir, id);
      if (!SLUG_PATTERN.test(id)) {
        report(logoDir, ["folder name must be lowercase words joined by dashes, e.g. comic-book-day"]);
        continue;
      }
      const logoErrors: string[] = [];
      const logo = await _readLogo(logoDir, date, id, logoErrors);
      report(logoDir, logoErrors);
      if (logo && !logoErrors.length) logos.push(logo);
    }
  }

  return { logos, errors };
};

if (import.meta.main) {
  const { logos, errors } = await collectLogos();
  if (errors.length) {
    console.error(`Found ${errors.length} problem${errors.length === 1 ? "" : "s"}:\n`);
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log(`All good, ${logos.length} logo${logos.length === 1 ? "" : "s"} checked.`);
}
