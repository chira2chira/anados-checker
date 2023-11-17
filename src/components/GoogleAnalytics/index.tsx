import { isProd } from "../../utils/env";
import { GA_GA4_ID } from "../../utils/gtag";

const GoogleAnalytics: React.FC = (props) => {
  return (
    <>
      {/* Global site tag (gtag.js) - Google Analytics */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_GA4_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: isProd
            ? `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
            `
            : "",
        }}
      />
    </>
  );
};

export default GoogleAnalytics;
