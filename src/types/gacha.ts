export type CharWeight = {
  id: number;
  weight: number;
};

/** gacha.yaml の1バナー分。SSGのpropsにはこの形で渡す */
export type GachaBanner = {
  id: number;
  nameJa: string;
  nameEn: string;
  revival: boolean;
  start: string;
  end: string;
  weight: Array<{
    rarity: number;
    weight: number;
  }>;
  pickUp: Array<{
    name: string;
    weight: number;
  }>;
  poolId: number;
};

/** 排出対象と累積確率を展開済みのバナー。クライアントで必要なバナー分だけ生成する */
export type GachaInfo = GachaBanner & {
  pool: CharWeight[];
};

/** gacha_pool.yaml の形式（キャラ名で記述） */
export type GachaPool = {
  id: number;
  rarity6: string[];
  rarity5: string[];
  rarity4: string[];
  rarity3: string[];
};

/** GachaPool のキャラ名をIDに変換したもの。SSGのpropsにはこの形で渡す */
export type GachaPoolIds = {
  id: number;
  rarity6: number[];
  rarity5: number[];
  rarity4: number[];
  rarity3: number[];
};
