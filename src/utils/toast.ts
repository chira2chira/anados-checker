import { OverlayToaster } from "@blueprintjs/core";

export const TopToaster =
  typeof document !== "undefined" // SSRでは使えない
    ? OverlayToaster.create({ position: "top" })
    : null;

export const BottomRightToaster =
  typeof document !== "undefined" // SSRでは使えない
    ? OverlayToaster.create({ position: "bottom-right", maxToasts: 1 })
    : null;
