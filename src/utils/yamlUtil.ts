import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { CharClass, CharInfo } from "../pages";
import { GachaInfo } from "@/pages/gacha/simulator";

const CLASS_SORT_LIST: CharClass[] = [
  "vanguard",
  "fighter",
  "guard",
  "shooter",
  "caster",
  "healer",
  "support",
  "stranger",
];

export function loadYaml<T>(yamlPath: string) {
  return yaml.load(
    fs.readFileSync(path.join(process.cwd(), yamlPath), "utf-8")
  ) as T;
}

export function loadCharactors() {
  const charInfo: CharInfo[] = loadYaml<CharInfo[]>("assets/charactor.yaml")
    .map((x) => ({
      ...x,
      image: x.image ?? "now_printing.png",
      release: x.release ?? "2021/12/24",
      owned: false,
    }))
    .sort(
      (x, y) => new Date(x.release).getTime() - new Date(y.release).getTime()
    )
    .sort(
      (x, y) =>
        CLASS_SORT_LIST.indexOf(x.class) - CLASS_SORT_LIST.indexOf(y.class)
    );

  if (
    charInfo.length !== Array.from(new Set(charInfo.map((x) => x.id))).length
  ) {
    throw new Error("IDが重複している");
  } else if (charInfo.filter((x) => x.id === null).length > 0) {
    throw new Error("IDが未指定");
  } else if (
    charInfo.length !==
    Array.from(new Set(charInfo.map((x) => x.unitId))).length
  ) {
    throw new Error("UnitIDが重複している");
  } else if (charInfo.filter((x) => x.unitId === null).length > 0) {
    throw new Error("UnitIDが未指定");
  }
  return charInfo;
}

function mergeRarity(rarity: number) {
  return function (name: string) {
    return {
      name,
      rarity,
    };
  };
}

export function loadGachaMaster() {
  const charInfo = loadCharactors();
  const gachaInfo: GachaInfo[] = loadYaml<GachaInfo[]>("assets/gacha.yaml").map(
    (x) => {
      const chars = [
        ...x.rarity6.map(mergeRarity(6)),
        ...x.rarity5.map(mergeRarity(5)),
        ...x.rarity4.map(mergeRarity(4)),
        ...x.rarity3.map(mergeRarity(3)),
      ];
      let accum = 0;
      return {
        ...x,
        rarity6: [],
        rarity5: [],
        rarity4: [],
        rarity3: [],
        pool: chars.map((y) => {
          const id = charInfo.find((z) => z.nameJa === y.name)?.id;
          if (id === undefined)
            throw new Error(`ガチャプールに不正なキャラがいる (${y.name})`);
          const rarityWeight = x.weight.find(
            (z) => z.rarity === y.rarity
          )?.weight;
          if (rarityWeight === undefined) throw new Error("レアリティが不正");
          // キャラ毎の確率にPU率を足す
          accum +=
            rarityWeight / chars.filter((z) => z.rarity === y.rarity).length;
          const pickUp = x.pickUp.find((z) => z.name === y.name);
          if (pickUp) {
            accum += pickUp.weight;
          }
          return {
            id,
            weight: Math.round(accum * 1_000_000) / 1_000_000, // 小数点第6位で四捨五入
          };
        }),
      };
    }
  );

  for (const gacha of gachaInfo) {
    const max = Math.max(...gacha.pool.map((x) => x.weight));
    if (max !== 1) {
      throw new Error(`ガチャ確率が100%にならない (${max})`);
    }
  }

  return {
    charInfo,
    gachaInfo: gachaInfo.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    ), // 開始日で降順。同日で並びを調整する場合は時間を入れる
  };
}
