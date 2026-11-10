import { join } from "node:path";
import { ImageExt, LogoFile } from "./enums";

export const ROOT = join(import.meta.dir, "..", "..", "..");
export const LOGOS_FOLDER = "logos";
export const LOGOS_DIR = join(ROOT, LOGOS_FOLDER);
export const MANIFEST_FILE = "manifest.json";
export const MANIFEST_PATH = join(ROOT, MANIFEST_FILE);
export const MANIFEST_VERSION = 1;
export const TEMPLATE_DIR = "_template";
export const DEFAULT_BRANCH = "main";
export const HTTPS_PROTOCOL = "https:";

export const DATE_PATTERN = /^\d{8}$/;
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const LOCALE_PATTERN = /^[a-z]{2,3}(-[A-Z]{2})?$/;
export const DEFAULT_LOCALE = "en-US";

export const BYTES_PER_KB = 1024;
export const MAX_IMAGE_BYTES = 1024 * BYTES_PER_KB;
export const SIGNATURE_BYTES = 16;
export const MAX_QUERY_LENGTH = 200;
export const MAX_TITLE_LENGTH = 120;
export const MAX_NAME_LENGTH = 80;

export const LOGO_KEYS = new Set(["$schema", "query", "title", "authors", "image"]);
export const AUTHOR_KEYS = new Set(["name", "url"]);
export const REQUIRED_FILES: string[] = [LogoFile.Json, LogoFile.Readme];

export const IMAGE_EXTS: string[] = Object.values(ImageExt);
export const IMAGE_NAMES = IMAGE_EXTS.map((ext) => `image.${ext}`);
export const IMAGE_PATTERN = new RegExp(`^image\\.(${IMAGE_EXTS.join("|")})$`);
