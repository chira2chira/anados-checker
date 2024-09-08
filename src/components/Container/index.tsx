import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { css } from "@emotion/react";
import CommonMeta from "@/components/CommonMeta";
import { Button, Drawer, MenuDivider } from "@blueprintjs/core";
import { useState } from "react";

const mainWrapper = css`
  position: relative;
  width: 100%;
  margin-left: 260px;

  @media (max-width: 992px) {
    margin-left: 0;
  }
`;

const main = css`
  max-width: 65em;
  margin: auto;
  padding: 70px 15px 0;
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

const desktopSideBar = css`
  display: block;

  @media (max-width: 992px) {
    display: none;
  }
`;

const menuButton = css`
  position: absolute;
  top: 10px;
  left: 10px;
  display: none;

  @media (max-width: 992px) {
    display: block;
  }
`;

type ContainerProps = {
  title?: string;
  description?: string;
  titleLink: string;
  children: React.ReactNode;
};

export const Container: React.FC<ContainerProps> = (props) => {
  const { t } = useTranslation("common");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <CommonMeta
        pageTitle={props.title}
        description={props.description}
        cardType="summary"
      />

      <div
        css={css`
          display: flex;
        `}
      >
        <div css={desktopSideBar}>
          <LinkSideBar />
        </div>
        <Drawer
          isOpen={menuOpen}
          position="left"
          size="260px"
          onClose={() => setMenuOpen(false)}
        >
          <LinkSideBar />
        </Drawer>

        <div css={mainWrapper}>
          <div css={menuButton}>
            <Button icon="menu" large onClick={() => setMenuOpen(!menuOpen)} />
          </div>
          <div
            css={css`
              margin: auto;
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
                <span>{t("ui.text.resources")}: </span>
                <a href="https://anothereidoswiki.ddns.net/index.php/Main_Page">
                  AnotherEidos Wiki
                </a>
              </div>
              <div>
                <span>{t("ui.text.respect")}: </span>
                <a href="https://eliya-bot.herokuapp.com/">
                  ワーフリ所有率チェッカー
                </a>
              </div>
              <div>
                <span>{t("ui.text.author")}: チラツキ </span>
                <a href="https://twitter.com/chira2chira">Twitter</a>{" "}
                <a href="https://www.youtube.com/@chira2chira">YouTube</a>{" "}
                <a href="https://github.com/chira2chira/anados-checker">
                  GitHub
                </a>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
};

type LinkSideBarProps = {};

const LinkSideBar: React.FC<LinkSideBarProps> = (props) => {
  const { asPath } = useRouter();
  const { t } = useTranslation("common");

  return (
    <div
      css={css`
        width: 260px;
        height: 100vh;
        position: fixed;
        overflow-y: scroll;
        overflow-x: hidden;
        scrollbar-width: none;
        background-color: #1c2127;
      `}
    >
      <div
        css={css`
          display: flex;
          flex-direction: column;

          & a {
            padding: 10px 25px;
            font-size: 110%;
          }
          & a:link,
          & a:visited {
            color: #fff;
          }
        `}
      >
        <img
          css={css`
            width: 60%;
            margin: 20px auto 30px;
          `}
          src="/static/image/common/logo.svg"
          alt="アナザーエイドス所持率チェッカー"
        />
        <Link href={"/"}>{t("ui.link.checker")}</Link>
        <Link href={"/gacha/simulator"}>{t("ui.link.gachasimu")}</Link>
        <Link href={"/still/manager"}>{t("ui.link.stillmng")}</Link>
        <Link href={"https://anados-generator.vercel.app/"}>
          {t("ui.link.generator")}
        </Link>
        <MenuDivider
          css={css`
            margin: 20px 0;
          `}
        />
        <Link href={asPath} locale="ja">
          日本語
        </Link>
        <Link href={asPath} locale="en">
          English
        </Link>
      </div>
    </div>
  );
};
