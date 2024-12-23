import { isProd } from "../../utils/env";
import { GA_GA4_ID } from "../../utils/gtag";
import { GoogleAnalytics as GA } from "@next/third-parties/google";

const GoogleAnalytics: React.FC = () => {
  return isProd && <GA gaId={GA_GA4_ID} />;
};

export default GoogleAnalytics;
