import { gottaCatchEm } from "./lib/logos/collect";
import { MANIFEST_FILE } from "./lib/config/constants";
import { plural } from "./lib/utils/helpers";
import { logger } from "./lib/utils/logger";
import { buildManifest, writeManifest } from "./lib/logos/manifest";

const { logos, errors } = await gottaCatchEm();

if (errors.length) {
  logger.error("Cannot build the manifest, run `bun scripts/validate.ts` to see what is wrong.");
  process.exit(1);
}

await writeManifest(buildManifest(logos));
logger.info(`Wrote ${MANIFEST_FILE} with ${plural(logos.length, "logo")}.`);
