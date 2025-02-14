import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { CharClass, CharInfo, EidosInfo, UnknownInfo } from "../pages";
import { GachaInfo } from "@/pages/gacha/simulator";
import still from "@/../assets/still.json";

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

export function loadEidosMaster() {
  const charInfo: CharInfo[] = loadYaml<CharInfo[]>("assets/charactor.yaml");
  const eidosInfo: EidosInfo[] = loadYaml<EidosInfo[]>("assets/eidos.yaml")
    .map((x) => {
      const char = charInfo.find((y) => y.unitId === x.unitId);
      if (char === undefined) {
        throw new Error(
          `エイドスに対応するキャラクターが見つからない: ${x.id}`
        );
      }
      return {
        ...x,
        unitNameJa: char.nameJa,
        unitNameEn: char.nameEn,
        image: x.image ?? "now_printing.png",
        release: x.release,
        owned: false,
      };
    })
    .sort(
      (x, y) => new Date(x.release).getTime() - new Date(y.release).getTime()
    );

  if (
    eidosInfo.length !== Array.from(new Set(eidosInfo.map((x) => x.id))).length
  ) {
    throw new Error("IDが重複している");
  } else if (eidosInfo.filter((x) => x.id === null).length > 0) {
    throw new Error("IDが未指定");
  } else if (
    eidosInfo.length !==
    Array.from(new Set(eidosInfo.map((x) => x.eidosId))).length
  ) {
    throw new Error("EidosIDが重複している");
  } else if (eidosInfo.filter((x) => x.eidosId === null).length > 0) {
    throw new Error("EidosIDが未指定");
  }
  return eidosInfo;
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
  const gachaInfo = generateGachaInfo(charInfo, "assets/gacha.yaml");

  return {
    charInfo,
    gachaInfo,
  };
}

export function loadEidosGachaMaster() {
  const eidosInfo = loadEidosMaster();
  const gachaInfo = generateGachaInfo(eidosInfo, "assets/gacha_eidos.yaml");

  return {
    eidosInfo,
    gachaInfo,
  };
}

function generateGachaInfo(info: UnknownInfo[], yamlPath: string) {
  const gachaInfo: GachaInfo[] = loadYaml<GachaInfo[]>(yamlPath).map((x) => {
    const pools = [
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
      pool: pools.map((y) => {
        const id = info.find((z) => z.nameJa === y.name)?.id;
        if (id === undefined)
          throw new Error(
            `ガチャプールに不正なキャラがいる (${y.name}, ${info.map(
              (z) => z.nameJa
            )})`
          );
        const rarityWeight = x.weight.find(
          (z) => z.rarity === y.rarity
        )?.weight;
        if (rarityWeight === undefined) throw new Error("レアリティが不正");
        // キャラ毎の確率にPU率を足す
        accum +=
          rarityWeight / pools.filter((z) => z.rarity === y.rarity).length;
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
  });

  for (const gacha of gachaInfo) {
    const max = Math.max(...gacha.pool.map((x) => x.weight));
    if (max !== 1) {
      throw new Error(`ガチャ確率が100%にならない (${max})`);
    }
  }

  // 開始日で降順。同日で並びを調整する場合は時間を入れる
  return gachaInfo.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}

export type StillInfo = {
  id: string;
  seq: number;
  label: string;
  image: string;
  read: boolean;
  rate: number;
};

export type CharInfoWithStill = CharInfo & {
  stills: StillInfo[];
};

type StillLabel = {
  id: string;
  prefix: string;
};

function getLabel(label: string, stillLabels: StillLabel[]) {
  if (label.startsWith("still")) {
    if (label.match(/secret_[0-9]+$/)) {
      return "Secret";
    } else if (label.match(/eidos$/)) {
      return "Eidos";
    }
    return "Still";
  }
  if (label.match(/^main_[0-9]+_[0-9]+$/)) {
    const [, capter] = label.split("_");
    return `Chapter ${Number(capter)}`;
  }
  for (const stillLabel of stillLabels) {
    if (label.startsWith(stillLabel.id)) {
      return `Event ${stillLabel.prefix}`;
    }
  }

  throw new Error("不明なラベル: " + label);
}

export function loadStillMaster() {
  const charInfo = loadCharactors();
  const stillLabels: StillLabel[] = loadYaml<StillLabel[]>(
    "assets/still_label.yaml"
  );

  // 整合性チェック
  const files = fs.readdirSync(
    path.join(process.cwd(), "public/static/image/still")
  );
  const images = still.master.map((x) => x.image);
  images.forEach((image) => {
    if (!files.includes(image))
      throw new Error(`スチル画像が存在しない: ${image}`);
  });
  files.forEach((file) => {
    if (!images.includes(file)) {
      console.log("[WARN] スチルマスターにない画像を削除", file);
      fs.rmSync(path.join(process.cwd(), "public/static/image/still", file));
    }
  });

  const charInfoWithStills: CharInfoWithStill[] = charInfo.map((x) => {
    const stills = still.master
      .filter((y) => {
        // ストーリー、秘密、エイドススチルはgroupに入っていたら表示
        if (
          (!y.label.startsWith("still") ||
            y.label.match(/_secret_/i) ||
            y.label.match(/eidos$/)) &&
          y.group.includes(x.unitId)
        )
          return true;
        if (!y.shared.includes(x.unitId)) return false;

        // 恒常と限定で好感度を共有しているか
        const bondStillRegex = /still[0-9]+_[^_]+$/i;
        if (y.label.match(bondStillRegex) && y.shared.length > 1) {
          // 低レアは低レア同士で共有しているので後続の処理不要
          if (1000 <= y.charId && y.charId < 3000) {
            return true;
          }
          // 共有スチルを取得
          const sharedBondStills = still.master
            .filter(
              (z) =>
                z.shared.includes(x.unitId) && z.label.match(bondStillRegex)
            )
            .map((z) => z.seq);
          // sharedのunitIdをidに変換し、実装順に並べる
          const sharedIds = y.shared
            .filter((z) => z < 8000)
            .map((z) => charInfo.filter((c) => c.unitId === z)[0].id)
            .sort((a, b) => (a < b ? -1 : 1));
          // 共有スチルのIndexとsharedのIndexが一致するか
          return sharedBondStills.indexOf(y.seq) === sharedIds.indexOf(x.id);
        }
        return true;
      })
      .map((y) => ({
        id: y.charId + ":" + y.seq,
        seq: y.seq,
        label: getLabel(y.label, stillLabels),
        image: y.image,
        read: false,
        rate: -1,
      }))
      .sort((a, b) => (a.label === "Still" ? -1 : 1));
    return { ...x, stills };
  });

  return {
    charInfoWithStills,
  };
}
