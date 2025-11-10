import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const logoPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/images/logo.png"
);

try {
  const stats = await sharp(logoPath).stats();
  const toHex = (value) => Math.round(value).toString(16).padStart(2, "0");

  const r = stats.channels[0]?.mean ?? 255;
  const g = stats.channels[1]?.mean ?? 255;
  const b = stats.channels[2]?.mean ?? 255;

  console.log(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
} catch (error) {
  console.error("No se pudo obtener el color del logo:", error);
  process.exit(1);
}

