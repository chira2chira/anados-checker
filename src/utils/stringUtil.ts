import { CharClass } from "@/pages";

export const displayCharClass = (charClass: CharClass) => {
  switch (charClass) {
    case "vanguard":
      return "ヴァンガード";
    case "fighter":
      return "ファイター";
    case "guard":
      return "ガード";
    case "shooter":
      return "シューター";
    case "caster":
      return "キャスター";
    case "healer":
      return "ヒーラー";
    case "support":
      return "サポーター";
    case "stranger":
      return "ストレンジャー";
  }
};
