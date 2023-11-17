import { OverlayToaster } from "@blueprintjs/core";

export const TopToaster =
  typeof document !== "undefined" // SSRでは使えない
    ? OverlayToaster.create({ position: "top" })
    : null;
