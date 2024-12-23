import "normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { appWithTranslation } from "next-i18next";
import { FocusStyleManager } from "@blueprintjs/core";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import GoogleAnalytics from "../components/GoogleAnalytics";
import HideSpoilerProvider from "@/providers/HideSpoilerProvider";

FocusStyleManager.onlyShowFocusOnTabs();

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <HideSpoilerProvider>
        <GoogleAnalytics />
        <Component {...pageProps} />
      </HideSpoilerProvider>
    </>
  );
}
export default appWithTranslation(MyApp);
