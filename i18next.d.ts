import "i18next";
import common from "./public/locales/ja/common.json";
import gacha from "./public/locales/ja/gacha.json";
import still from "./public/locales/ja/still.json";
import info from "./public/locales/ja/info.json";

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
      info: typeof info;
    };
    // other
  }
}
