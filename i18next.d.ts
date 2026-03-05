import "i18next";
import common from "./public/locales/ja/common.json";
import gacha from "./public/locales/ja/gacha.json";
import still from "./public/locales/ja/still.json";
import nineStills from "./public/locales/ja/nine-stills.json";
import info from "./public/locales/ja/info.json";
import privacy from "./public/locales/ja/privacy.json";

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
      "nine-stills": typeof nineStills;
      info: typeof info;
      privacy: typeof privacy;
    };
    // other
  }
}
