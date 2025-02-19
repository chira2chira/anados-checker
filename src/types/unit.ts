import { PartialForKeys } from "@/utils/types";
import { StillInfo } from "./still";

export type CharClass =
  | "vanguard"
  | "fighter"
  | "guard"
  | "shooter"
  | "caster"
  | "healer"
  | "support"
  | "stranger";

export type CharInfo = {
  id: number;
  unitId: number;
  nameJa: string;
  nameEn: string;
  rarity: number;
  class: CharClass;
  deployment: string;
  limited: boolean;
  release: string;
  image: string;
  owned: boolean;
};

export type EidosInfo = {
  id: number;
  eidosId: number;
  nameJa: string;
  nameEn: string;
  unitId: number;
  unitNameJa: string;
  unitNameEn: string;
  rarity: number;
  limited: boolean;
  release: string;
  image: string;
  owned: boolean;
};

export type UnknownInfo = PartialForKeys<CharInfo, EidosInfo>;

export type CharInfoWithStill = CharInfo & {
  stills: StillInfo[];
};
