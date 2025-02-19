import type { CharInfo, EidosInfo } from "@/types/unit";

export type PartialForKeys<T, U> = {
  [K in Exclude<keyof T, keyof U>]?: T[K];
} & {
  [K in Exclude<keyof U, keyof T>]?: U[K];
} & {
  [K in Extract<keyof T, keyof U>]: T[K];
};

export function isCharInfo(arg: any): arg is CharInfo {
  return arg.class !== undefined;
}

export function isEidosInfo(arg: any): arg is EidosInfo {
  return arg.eidosId !== undefined;
}
