import CommonMeta from "@/components/CommonMeta";
import { db } from "@/utils/db";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export const TEMP_CHAR_KEY = "tmp_chars";

type ShareIdProps = {
  chars: string;
  percent: number;
  owned: number;
  charCount: number;
};

const ShareId: NextPage<ShareIdProps> = (props) => {
  const { push, asPath } = useRouter();
  const { t, i18n } = useTranslation("common");

  const pageTitle = `${props.percent.toFixed()}% (${props.owned}/${
    props.charCount
  })`;

  useEffect(() => {
    window.localStorage.setItem(TEMP_CHAR_KEY, props.chars);
    push("/", asPath, { locale: i18n.language });
  }, [push, asPath, props.chars, i18n]);

  return (
    <>
      <CommonMeta pageTitle={pageTitle} cardType="summary" />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<ShareIdProps> = async (
  context
) => {
  const id = context.query.id;

  if (typeof id !== "string") {
    return {
      props: {
        ...(await serverSideTranslations(context.locale!, ["common"])),
        chars: "",
        percent: 0,
        owned: 0,
        charCount: 0,
      },
    };
  }

  const result = await db
    .selectFrom("sharechar")
    .select(["chars", "percent", "owned", "char_count"])
    .where("id", "=", id)
    .executeTakeFirst();

  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common"])),
      chars: result?.chars ?? "",
      percent: Number(result?.percent) || 0,
      owned: result?.owned || 0,
      charCount: result?.char_count || 0,
    },
  };
};

export default ShareId;
