import "i18next";
import common from "./public/locales/ja/common.json";
import gacha from "./public/locales/ja/gacha.json";
import still from "./public/locales/ja/still.json";
import backup from "./public/locales/ja/backup.json";

declare module "i18next" {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    defaultNS: "common";
    // custom resources type
    resources: {
      common: typeof common;
      gacha: typeof gacha;
      still: typeof still;
      backup: typeof backup;
    };
    // other
  }
}