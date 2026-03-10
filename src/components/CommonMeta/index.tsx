import Head from "next/head";
import React, { useEffect } from "react";
import { isProd } from "../../utils/env";
import { useTranslation } from "next-i18next";

export type CardType = "summary" | "summary_large_image" | "9stills";

type CommonMetaProps = {
  pageTitle?: string;
  description?: string;
  cardType: CardType;
};

function getCardImage(type: CommonMetaProps["cardType"]): string {
  switch (type) {
    case "summary":
    case "summary_large_image":
      return "https://anados-collection-tracker.vercel.app/ogp.png";
    case "9stills":
      return "https://anados-collection-tracker.vercel.app/ogp_9stills.png";
  }
}

const CommonMeta: React.FC<CommonMetaProps> = (props) => {
  const { t } = useTranslation("common");

  const title = (props.pageTitle ? `${props.pageTitle} | ` : "") + t("title");
  const description = props.description || t("description");
  return (
    <>
      <Head>
        {/* タイトルタグに複数要素を入れてはいけない */}
        <title>{`${isProd ? "" : "[DEV]"}${title}`}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="龍脈のアナザーエイドスR,アナドスR,アナドス,AnotherEidos of Dragon Vein"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta
          property="og:url"
          content="https://anados-collection-tracker.vercel.app/"
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={t("title")} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={getCardImage(props.cardType)} />
        <meta name="twitter:card" content={props.cardType} />
      </Head>
    </>
  );
};

export default CommonMeta;
