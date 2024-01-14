import fs from "node:fs/promises";
import { getPlaiceholder } from "plaiceholder";

export async function getBannerPlaceholder(ids: number[]) {
  const ja: { [key: number]: string } = {},
    en: { [key: number]: string } = {};
  for (const id of ids) {
    const [plJa, plEn] = await Promise.all([
      getImagePlaceholder(`public/static/image/banner/ja/main/${id}.png`),
      getImagePlaceholder(`public/static/image/banner/en/main/${id}.png`),
    ]);
    ja[id] = plJa;
    en[id] = plEn;
  }
  return { ja, en };
}

async function getImagePlaceholder(path: string) {
  const file = await fs.readFile(path);
  const { base64 } = await getPlaiceholder(file);
  return base64;
}
