import MersenneTwister from "mersennetwister";
import { CharWeight, GachaBanner, GachaInfo, GachaPoolIds } from "@/types/gacha";
import { UnknownInfo } from "@/types/unit";

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

/**
 * バナー定義とプールマスターから、キャラ毎の累積確率を持つ排出プールを生成する。
 * ビルド時の検証とクライアントでの算出の両方で使うため、fs等に依存しないこと。
 */
export function buildGachaPool(
  banner: GachaBanner,
  poolMaster: GachaPoolIds,
  info: UnknownInfo[]
): CharWeight[] {
  const pools: Array<{ id: number; rarity: number }> = [
    ...poolMaster.rarity6.map((id) => ({ id, rarity: 6 })),
    ...poolMaster.rarity5.map((id) => ({ id, rarity: 5 })),
    ...poolMaster.rarity4.map((id) => ({ id, rarity: 4 })),
    ...poolMaster.rarity3.map((id) => ({ id, rarity: 3 })),
  ];
  // PUキャラ追加
  const pickUps = banner.pickUp.map((p) => {
    const char = info.find((z) => z.nameJa === p.name);
    if (char === undefined)
      throw new Error(`ピックアップキャラが不正（${p.name}）`);
    return { char, weight: p.weight };
  });
  for (const { char } of pickUps) {
    if (pools.some((y) => y.id === char.id)) continue;
    pools.push({ id: char.id, rarity: char.rarity });
  }

  let accum = 0;
  return pools.map((y) => {
    const rarityWeight = banner.weight.find(
      (z) => z.rarity === y.rarity
    )?.weight;
    if (rarityWeight === undefined) throw new Error("レアリティが不正");
    // キャラ毎の確率にPU率を足す
    accum += rarityWeight / pools.filter((z) => z.rarity === y.rarity).length;
    const pickUp = pickUps.find((z) => z.char.id === y.id);
    if (pickUp) {
      accum += pickUp.weight;
    }
    return {
      id: y.id,
      weight: Math.round(accum * 1_000_000) / 1_000_000, // 小数点第6位で四捨五入
    };
  });
}

export function toGachaInfo(
  banner: GachaBanner,
  gachaPool: GachaPoolIds[],
  info: UnknownInfo[]
): GachaInfo {
  const poolMaster = gachaPool.find((x) => x.id === banner.poolId);
  if (poolMaster === undefined)
    throw new Error(`不明なガチャプールID: ${banner.poolId}`);
  return { ...banner, pool: buildGachaPool(banner, poolMaster, info) };
}
