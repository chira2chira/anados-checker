export type CharWeight = {
  id: number;
  weight: number;
};

export type GachaInfo = {
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
  rarity6: string[];
  rarity5: string[];
  rarity4: string[];
  rarity3: string[];
  pool: CharWeight[];
};
