#!/usr/bin/env node

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const spritesPath = join(
  __dirname,
  "..",
  "packages",
  "gsnake-web-ui",
  "assets",
  "sprites.svg",
);
const typesPath = join(
  __dirname,
  "..",
  "packages",
  "gsnake-web-app",
  "types",
  "models.ts",
);

function extractCellTypes(content) {
  const match = content.match(/export\s+type\s+CellType\s*=\s*([\s\S]*?);/m);
  if (!match) {
    throw new Error("Unable to parse CellType union from models.ts");
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].map(([, value]) => value);
}

function extractSpriteIds(content) {
  return [...content.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(
    ([, id]) => id,
  );
}

try {
  const cellTypes = extractCellTypes(readFileSync(typesPath, "utf8"));
  const spriteIds = extractSpriteIds(readFileSync(spritesPath, "utf8"));

  const cellTypeSet = new Set(cellTypes);
  const spriteSet = new Set(spriteIds);

  const missingSprites = cellTypes.filter((value) => !spriteSet.has(value));
  const orphanedSprites = spriteIds.filter((value) => !cellTypeSet.has(value));

  if (missingSprites.length > 0 || orphanedSprites.length > 0) {
    if (missingSprites.length > 0) {
      console.error(
        `Missing sprites for CellType values: [${missingSprites.join(", ")}]`,
      );
    }

    if (orphanedSprites.length > 0) {
      console.error(
        `Orphaned sprites without CellType: [${orphanedSprites.join(", ")}]`,
      );
    }

    process.exit(1);
  }

  console.log(
    `Sprite validation passed (${cellTypes.length} CellType values, ${spriteIds.length} sprite symbols).`,
  );
} catch (error) {
  console.error(String(error));
  process.exit(1);
}
