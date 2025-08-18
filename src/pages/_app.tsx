import "normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import { appWithTranslation } from "next-i18next";
import { FocusStyleManager } from "@blueprintjs/core";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import GoogleAnalytics from "../components/GoogleAnalytics";
import HideSpoilerProvider from "@/providers/HideSpoilerProvider";
import CustomLabelProvider from "@/providers/CustomLabelProvider";

if (process.env.NODE_ENV === "development") {
  if (typeof window !== "undefined") {
    const whyDidYouRender = require("@welldone-software/why-did-you-render");
    whyDidYouRender(React, {
      trackAllPureComponents: true,
      exclude: [/^Blueprint5\./],
    });
  }
}

FocusStyleManager.onlyShowFocusOnTabs();

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <HideSpoilerProvider>
        <CustomLabelProvider>
          <GoogleAnalytics />
          <Component {...pageProps} />
        </CustomLabelProvider>
      </HideSpoilerProvider>
    </>
  );
}
export default appWithTranslation(MyApp);
