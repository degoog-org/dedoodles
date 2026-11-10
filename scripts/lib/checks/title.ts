import { DEFAULT_LOCALE, LOCALE_PATTERN, MAX_TITLE_LENGTH } from "../config/constants";
import { isRecord, isText } from "../utils/guards";
import type { Title } from "../config/types";

export const checkTitle = (title: unknown, errors: string[]): Title | null => {
  if (!isRecord(title)) {
    errors.push(`"title" must be an object like { "${DEFAULT_LOCALE}": "Happy ..." }`);
    return null;
  }

  if (!(DEFAULT_LOCALE in title)) errors.push(`"title" needs an "${DEFAULT_LOCALE}" entry`);

  for (const [locale, text] of Object.entries(title)) {
    if (!LOCALE_PATTERN.test(locale)) errors.push(`"title" has an invalid locale "${locale}"`);
    if (!isText(text, MAX_TITLE_LENGTH)) {
      errors.push(`"title.${locale}" must be text up to ${MAX_TITLE_LENGTH} characters`);
    }
  }

  return title as Title;
};
