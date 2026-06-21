import MersenneTwister from "mersennetwister";
import { GachaInfo } from "@/types/gacha";

const mt = new MersenneTwister();

export function getBannerImageId(id: number) {
  return id >= 10000 ? 10001 : id;
}

export function gacha(gachaInfo: GachaInfo) {
  const rnd = mt.random();

  for (const char of gachaInfo.pool) {
    if (rnd <= char.weight) return char.id;
  }

  throw new Error("ガチャに当たらなかった");
}
