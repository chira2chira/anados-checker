export const GA_GA4_ID = "G-1G15M4TBD9";

type GtagEvent = {
  /** レポートでイベントアクションとして表示される値 */
  action: string;
  /** イベントのカテゴリ */
  category: string;
  /** イベントのラベル */
  label: string;
  /** 0以上の整数。省略時は1 */
  value?: string;
};

export const sendEvent: (e: GtagEvent) => void = ({
  action,
  category,
  label,
  value = "",
}) => {
  if (window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: JSON.stringify(label),
      value,
    });
  } else {
    console.log("DEBUG::EVENT", action, category, label, value);
  }
};

export const sendPageview = (path: string) => {
  if (window.gtag) {
    window.gtag("config", GA_GA4_ID, {
      page_path: path,
    });
  }
};
