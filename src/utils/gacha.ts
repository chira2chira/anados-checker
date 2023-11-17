import MersenneTwister from "mersennetwister";
import { GachaInfo } from "@/pages/gacha/simulator";

const mt = new MersenneTwister();

export function gacha(gachaInfo: GachaInfo) {
  const rnd = mt.random();

  for (const char of gachaInfo.pool) {
    if (rnd <= char.weight) return char.id;
  }

  throw new Error("ガチャに当たらなかった");
}
