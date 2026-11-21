import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import {
  CharClass,
  CharInfo,
  EidosInfo,
  UnknownInfo,
  CharInfoWithStill,
} from "@/types/unit";
import { GachaBanner, GachaPool, GachaPoolIds } from "@/types/gacha";
import { toGachaInfo } from "@/utils/gacha";
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

export function loadGachaMaster() {
  const charInfo = loadCharactors();
  const { gachaInfo, gachaPool } = generateGachaInfo(
    charInfo,
    "assets/gacha.yaml",
    "assets/gacha_pool.yaml"
  );

  return {
    charInfo,
    gachaInfo,
    gachaPool,
  };
}

export function loadEidosGachaMaster() {
  const eidosInfo = loadEidosMaster();
  const { gachaInfo, gachaPool } = generateGachaInfo(
    eidosInfo,
    "assets/gacha_eidos.yaml",
    "assets/gacha_eidos_pool.yaml"
  );

  return {
    eidosInfo,
    gachaInfo,
    gachaPool,
  };
}

/**
 * バナー定義とプールマスター（キャラ名→IDに変換済み）を返す。
 * 展開済みの排出プールはバナー数×キャラ数でSSGのデータが肥大化するため返さず、
 * クライアントで toGachaInfo により必要なバナー分だけ生成する。
 * ここでは全バナーのプールを生成してデータの整合性のみ検証する。
 */
function generateGachaInfo(
  info: UnknownInfo[],
  yamlPath: string,
  poolYamlPath: string
): { gachaInfo: GachaBanner[]; gachaPool: GachaPoolIds[] } {
  const toId = (name: string) => {
    const id = info.find((z) => z.nameJa === name)?.id;
    if (id === undefined)
      throw new Error(
        `ガチャプールに不正なキャラがいる (${name}, ${info.map(
          (z) => z.nameJa
        )})`
      );
    return id;
  };
  const gachaPool: GachaPoolIds[] = loadYaml<GachaPool[]>(poolYamlPath).map(
    (x) => ({
      id: x.id,
      rarity6: x.rarity6.map(toId),
      rarity5: x.rarity5.map(toId),
      rarity4: x.rarity4.map(toId),
      rarity3: x.rarity3.map(toId),
    })
  );
  const gachaInfo = loadYaml<GachaBanner[]>(yamlPath);

  for (const banner of gachaInfo) {
    const { pool } = toGachaInfo(banner, gachaPool, info);
    const max = Math.max(...pool.map((x) => x.weight));
    if (max !== 1) {
      throw new Error(`ガチャ確率が100%にならない (${banner.id}: ${max})`);
    }
  }

  // 実際に使われているプールだけ渡す
  const usedPoolIds = new Set(gachaInfo.map((x) => x.poolId));

  // 開始日で降順。同日で並びを調整する場合は時間を入れる
  return {
    gachaInfo: gachaInfo.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    ),
    gachaPool: gachaPool.filter((x) => usedPoolIds.has(x.id)),
  };
}

type StillLabel = {
  id: string;
  prefix: string;
};

function getLabel(label: string, stillLabels: StillLabel[]) {
  if (label.match(/eidos$/)) {
    return "Eidos";
  }
  if (label.startsWith("still")) {
    if (label.match(/secret_[0-9]+$/)) {
      return "Secret";
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
      .map((y) => {
        // 共有スチルが固有スチルに変更された場合のマイグレーションに必要
        const groupIds = y.group
          .filter((z) => z < 8000)
          .map((z) => charInfo.filter((c) => c.unitId === z)[0].id)
          .sort((a, b) => (a < b ? -1 : 1));
        return {
          id: y.charId + ":" + y.seq,
          groupIds,
          seq: y.seq,
          label: getLabel(y.label, stillLabels),
          image: y.image,
          animated: y.animated,
          read: false,
          rate: -1,
        };
      })
      .sort((a, b) => (a.label === "Still" ? -1 : 1));
    return { ...x, stills };
  });

  return {
    charInfoWithStills,
  };
}
