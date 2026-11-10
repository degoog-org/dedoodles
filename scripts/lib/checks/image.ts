import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { BYTES_PER_KB, IMAGE_NAMES, IMAGE_PATTERN, MAX_IMAGE_BYTES, SIGNATURE_BYTES } from "../config/constants";
import { ImageExt } from "../config/enums";
import { isImageExt } from "../utils/guards";
import { ascii } from "../utils/helpers";
import type { Sniffer } from "../config/types";

const _isJpeg: Sniffer = (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

const IMAGE_SIGNATURES: Record<ImageExt, Sniffer> = {
  [ImageExt.Png]: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  [ImageExt.Jpg]: _isJpeg,
  [ImageExt.Jpeg]: _isJpeg,
  [ImageExt.Webp]: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP",
  [ImageExt.Avif]: (b) => ascii(b, 4, 8) === "ftyp" && ascii(b, 8, 12).startsWith("avi"),
};

const _toKb = (bytes: number): number => Math.ceil(bytes / BYTES_PER_KB);

export const voightKampff = (extension: string, bytes: Uint8Array): boolean =>
  isImageExt(extension) && IMAGE_SIGNATURES[extension](bytes);

export const checkImage = async (dir: string, image: unknown, errors: string[]): Promise<void> => {
  if (typeof image !== "string" || !IMAGE_PATTERN.test(image)) {
    errors.push(`"image" must be one of ${IMAGE_NAMES.join(", ")}`);
    return;
  }

  const path = join(dir, image);
  const info = await stat(path).catch(() => null);
  if (!info?.isFile()) {
    errors.push(`"${image}" is missing`);
    return;
  }

  if (info.size > MAX_IMAGE_BYTES) {
    errors.push(`"${image}" is ${_toKb(info.size)} KB, the limit is ${MAX_IMAGE_BYTES / BYTES_PER_KB} KB`);
  }

  const extension = image.slice(image.lastIndexOf(".") + 1);
  const bytes = new Uint8Array(await readFile(path)).subarray(0, SIGNATURE_BYTES);
  if (!voightKampff(extension, bytes)) {
    errors.push(`"${image}" is not a real .${extension} file`);
  }
};
