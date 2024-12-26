import type { StillState } from "@/pages/still/manager";

/** 間違って追加したキャラとか */
const BAN_CHAR = [53];
export function parseLocalStorageChar(value: string) {
  return value
    .split(",")
    .map(Number)
    .filter((x) => !BAN_CHAR.includes(x));
}

export function parseLocalStorageEidos(value: string) {
  return value.split(",").map(Number);
}

export function parseLocalStorageCustomLabel(value: string) {
  return value.split(",");
}

export function parseLocalStorageStill(value: string): StillState[] {
  let data;
  try {
    data = JSON.parse(value);
  } catch (error) {
    return [];
  }
  if (!Array.isArray(data) || data.length === 0) return [];

  if (typeof data[0] === "string") {
    return data.map((x: string) => {
      const [id, read, rate] = x.split(",");
      return {
        id,
        read: read === "1",
        rate: Number(rate),
      };
    });
  } else {
    // 旧データ
    return data;
  }
}

export function deserializeStill(stills: StillState[]) {
  const tmp: string[] = stills
    .filter((x) => !(!x.read && x.rate === -1)) // デフォルト除外
    .map((x) => `${x.id},${Number(x.read)},${x.rate}`);
  return JSON.stringify(tmp);
}
