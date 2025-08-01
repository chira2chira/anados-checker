import { GetStaticProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { css } from "@emotion/react";
import { Card, H3 } from "@blueprintjs/core";
import { Container } from "@/components/Container";

type PrivacyProps = {};

const Privacy: NextPage<PrivacyProps> = () => {
  const { t } = useTranslation("privacy");

  return (
    <Container
      titleLink="/privacy"
      title={t("title")}
      description={t("description")}
    >
      <Card
        css={css`
          display: flex;
          flex-direction: column;
          gap: 15px;
          line-height: 1.7;
        `}
      >
        <div>
          <H3>{t("head.about")}</H3>
          <p>{t("message.about")}</p>
        </div>
        <div>
          <H3>{t("head.accessAnalysis")}</H3>
          <p>{t("message.accessAnalysis")}</p>
        </div>
        <div>
          <H3>{t("head.disclaimer")}</H3>
          <p>{t("message.disclaimer")}</p>
        </div>
      </Card>
    </Container>
  );
};

export const getStaticProps: GetStaticProps<PrivacyProps> = async (context) => {
  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common", "privacy"])),
    },
  };
};

export default Privacy;
