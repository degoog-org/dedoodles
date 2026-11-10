import { AUTHOR_KEYS, MAX_NAME_LENGTH } from "../config/constants";
import { isHttpsUrl, isRecord, isText } from "../utils/guards";
import { unknownKeys } from "../utils/helpers";
import type { Author } from "../config/types";

const _toAuthor = (author: Record<string, unknown>): Author => ({
  name: String(author.name),
  ...(typeof author.url === "string" ? { url: author.url } : {}),
});

const _checkAuthor = (author: unknown, index: number, errors: string[]): Author[] => {
  const label = `authors[${index}]`;

  if (!isRecord(author)) {
    errors.push(`"${label}" must be an object with a "name"`);
    return [];
  }

  const extra = unknownKeys(author, AUTHOR_KEYS);
  if (extra.length) errors.push(`"${label}" has unknown fields: ${extra.join(", ")}`);

  if (!isText(author.name, MAX_NAME_LENGTH)) {
    errors.push(`"${label}.name" must be text up to ${MAX_NAME_LENGTH} characters`);
  }

  if (author.url !== undefined && !isHttpsUrl(author.url)) {
    errors.push(`"${label}.url" must be an https link`);
  }

  return [_toAuthor(author)];
};

export const checkAuthors = (authors: unknown, errors: string[]): Author[] => {
  if (!Array.isArray(authors) || authors.length === 0) {
    errors.push(`"authors" must list at least one author`);
    return [];
  }

  return authors.flatMap((author, index) => _checkAuthor(author, index, errors));
};
