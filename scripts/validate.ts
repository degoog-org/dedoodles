import { gottaCatchEm } from "./lib/logos/collect";
import { plural } from "./lib/utils/helpers";
import { logger } from "./lib/utils/logger";

const { logos, errors } = await gottaCatchEm();

if (errors.length) {
  logger.error(`Found ${plural(errors.length, "problem")}:\n`);
  errors.forEach((error) => logger.error(`  - ${error}`));
  process.exit(1);
}

logger.info(`All good, ${plural(logos.length, "logo")} checked.`);
