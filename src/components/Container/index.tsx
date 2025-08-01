import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { css } from "@emotion/react";
import CommonMeta from "@/components/CommonMeta";
import { Button, Drawer, EntityTitle, MenuDivider } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import { getImageUrl } from "@/utils/image";

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

  const handleCloseMenu = useCallback(() => setMenuOpen(false), []);

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
          onClose={handleCloseMenu}
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
                <a href="https://anothereidos.wikioasis.org/wiki/Main_Page">
                  AnotherEidos R Wiki
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
              <div>
                <Link href={"/info"}>{t("ui.link.info")}</Link>{" / "}
                <Link href={"/privacy"}>{t("ui.link.privacy")}</Link>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
};

const LinkSideBar: React.FC = React.memo(() => {
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
            margin: 30px auto 30px;
          `}
          src={getImageUrl("common/logo.svg")}
          alt="アナザーエイドス所持率チェッカー"
        />
        <Link href={"/"}>{t("ui.link.checker")}</Link>
        <Link href={"/gacha/simulator"}>{t("ui.link.gachasimu")}</Link>
        <Link href={"/still/manager"}>{t("ui.link.stillmng")}</Link>
        <Link href={"https://anados-generator.vercel.app/"}>
          {t("ui.link.generator")}
        </Link>
        <Link href={"/info"}>
          <EntityTitle icon="cog" title={t("ui.link.info")} />
        </Link>
        <MenuDivider
          css={css`
            margin: 20px 0;
          `}
        />
        <Link href={asPath} locale="ja" scroll={false}>
          日本語
        </Link>
        <Link href={asPath} locale="en" scroll={false}>
          English
        </Link>
      </div>
    </div>
  );
});
LinkSideBar.displayName = "LinkSideBar";
