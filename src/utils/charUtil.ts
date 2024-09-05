/** 間違って追加したキャラとか */
const BAN_CHAR = [53];
export function parseLocalStorageChar(value: string) {
  return value
    .split(",")
    .map(Number)
    .filter((x) => !BAN_CHAR.includes(x));
}

export function parseLocalStorageStill(value: string) {
  return JSON.parse(value);
}
