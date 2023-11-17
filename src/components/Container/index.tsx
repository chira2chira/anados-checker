import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { css } from "@emotion/react";
import CommonMeta from "@/components/CommonMeta";

const main = css`
  max-width: 65em;
  margin: auto;
  padding: 40px 15px 0;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const title = css`
  margin-bottom: 20px;

  &:link,
  &:visited {
    color: #f6f7f9;
  }
`;

type ContainerProps = {
  title?: string;
  titleLink: string;
  children: React.ReactNode;
};

export const Container: React.FC<ContainerProps> = (props) => {
  const { asPath, locale, push } = useRouter();
  const { t } = useTranslation("common");

  const handleChangeLocale: React.ChangeEventHandler<HTMLSelectElement> = (
    e
  ) => {
    push("/" + e.currentTarget.value + asPath, undefined, {
      locale: e.currentTarget.value,
    });
  };

  return (
    <>
      <CommonMeta pageTitle={props.title} cardType="summary" />

      <div
        css={css`
          display: flex;
          padding: 3px 10px 0;
          gap: 13px;
          font-size: 90%;
        `}
      >
        <Link href={"/"}>{t("ui.link.checker")}</Link>
        <Link href={"/gacha/simulator"}>{t("ui.link.gachasimu")}</Link>
        <Link href={"https://anados-generator.vercel.app/"}>
          {t("ui.link.generator")}
        </Link>
      </div>

      <div
        css={css`
          position: relative;
        `}
      >
        <main css={main}>
          <Link href={props.titleLink} css={title}>
            <h1
              css={css`
                font-size: 170%;
              `}
            >
              {props.title || t("title")}
            </h1>
          </Link>

          {props.children}
        </main>
        <footer
          css={css`
            margin-bottom: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          `}
        >
          <div>
            {t("ui.text.resources")}:{" "}
            <a href="https://anothereidoswiki.ddns.net/index.php/Main_Page">
              AnotherEidos Wiki
            </a>
          </div>
          <div>
            {t("ui.text.respect")}:{" "}
            <a href="https://eliya-bot.herokuapp.com/">
              ワーフリ所有率チェッカー
            </a>
          </div>
          <div>
            {t("ui.text.author")}: チラツキ{" "}
            <a href="https://twitter.com/chira2chira">Twitter</a>{" "}
            <a href="https://www.youtube.com/@chira2chira">YouTube</a>{" "}
            <a href="https://github.com/chira2chira/anados-checker">GitHub</a>
          </div>
        </footer>

        <div
          className="bp5-html-select"
          css={css`
            position: absolute;
            top: 10px;
            left: 10px;
          `}
        >
          <select value={locale} onChange={handleChangeLocale}>
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
          <span className="bp5-icon bp5-icon-translate"></span>
        </div>
      </div>
    </>
  );
};
