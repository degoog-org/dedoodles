import { HTTPS_PROTOCOL, IMAGE_EXTS } from "../config/constants";
import { ImageExt } from "../config/enums";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

export const isHttpsUrl = (value: unknown): boolean =>
  typeof value === "string" && URL.canParse(value) && new URL(value).protocol === HTTPS_PROTOCOL;

export const isImageExt = (value: string): value is ImageExt => IMAGE_EXTS.includes(value);

export const isRealDate = (date: string): boolean => {
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
