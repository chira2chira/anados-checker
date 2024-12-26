import { GetStaticProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ChangeEventHandler, useContext, useRef, useState } from "react";
import { css } from "@emotion/react";
import { Button, Card, H3 } from "@blueprintjs/core";
import { Container } from "@/components/Container";
import { sendEvent } from "@/utils/gtag";
import { parseLocalStorageCustomLabel } from "@/utils/charUtil";
import { CustomLabelContext } from "@/providers/CustomLabelProvider";

const CHAR_KEY = "chars";
const EIDOS_KEY = "eidos";
const STILL_KEY = "still";
const CLABEL_KEY = "still_customlabel";

type BackupData = {
  version: Number;
  char: string | null;
  eidos: string | null;
  still: string | null;
  customLabel: string | null;
};

type InfoProps = {};

function isBackupData(data: any): data is BackupData {
  return typeof data.version === "number";
}

function readFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = (e) => {
      resolve(e.target?.result as string | null);
    };
    fr.readAsText(file);
  });
}

const Info: NextPage<InfoProps> = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { setCustomLabels } = useContext(CustomLabelContext);
  const { t } = useTranslation("info");

  const exportBackup = () => {
    setError("");
    const storedCharValue = window.localStorage.getItem(CHAR_KEY);
    const storedEidosValue = window.localStorage.getItem(EIDOS_KEY);
    const storedStillValue = window.localStorage.getItem(STILL_KEY);
    const storedCustomLabelValue = window.localStorage.getItem(CLABEL_KEY);
    if (!storedCharValue && !storedEidosValue && !storedStillValue) {
      return setError(t("message.e_dataNotFound"));
    }

    const data: BackupData = {
      version: 1,
      char: storedCharValue,
      eidos: storedEidosValue,
      still: storedStillValue,
      customLabel: storedCustomLabelValue,
    };
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });

    const aElm = document.createElement("a");
    aElm.href = URL.createObjectURL(blob);
    aElm.setAttribute(
      "download",
      "anadostracker-backup_" + new Date().getTime() + ".json"
    );
    aElm.click();

    sendEvent({
      action: "export",
      category: "backup",
      label: "success",
    });
  };

  const importBackup = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
    setError("");
    setMessage("");
    if (inputFileRef.current === null) return;

    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.match(/\.json$/)) {
      inputFileRef.current.value = "";
      return setError(t("message.e_dataNotJson"));
    }
    const text = await readFile(file);
    inputFileRef.current.value = "";
    if (text === null) {
      return setError(t("message.e_readFailed"));
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch (error) {
      return setError(t("message.e_invalidFormat"));
    }
    if (!isBackupData(json)) {
      return setError(t("message.e_dataNotBackupData"));
    }
    const imported: string[] = [];
    if (!!json.char) {
      imported.push(t("message.char"));
      window.localStorage.setItem(CHAR_KEY, json.char);
    }
    if (!!json.eidos) {
      imported.push(t("message.eidos"));
      window.localStorage.setItem(EIDOS_KEY, json.eidos);
    }
    if (!!json.still) {
      imported.push(t("message.still"));
      window.localStorage.setItem(STILL_KEY, json.still);
    }
    if (!!json.customLabel) {
      imported.push(t("message.customLabel"));
      setCustomLabels(parseLocalStorageCustomLabel(json.customLabel));
    }
    setMessage(t("message.importComplete") + imported.join(", "));

    sendEvent({
      action: "import",
      category: "backup",
      label: "success",
    });
  };

  return (
    <Container
      titleLink="/info"
      title={t("title")}
      description={t("description")}
    >
      <div
        css={css`
          display: flex;
          flex-direction: column;
          gap: 20px;
        `}
      >
        <Card>
          <H3>Special Thanks</H3>
          <ul
            css={css`
              line-height: 1.7;
            `}
          >
            <li>
              <a href="https://eliya-bot.herokuapp.com/">
                ワーフリ所有率チェッカー
              </a>
            </li>
            <li>
              <a href="https://prts.wiki/w/%E9%A6%96%E9%A1%B5">PRTS.WIKI</a>
            </li>
          </ul>
        </Card>
        <Card>
          <H3>{t("head.backup")}</H3>
          <div style={{ marginBottom: "20px" }}>
            {t("message.backupOverview")}
          </div>
          <div
            css={css`
              display: flex;
              gap: 15px;
              margin-bottom: 20px;
            `}
          >
            <Button large intent="primary" onClick={exportBackup}>
              {t("button.export")}
            </Button>
            <input
              ref={inputFileRef}
              style={{ display: "none" }}
              type="file"
              accept=".json"
              onChange={handleFileChange}
            />
            <Button large intent="primary" onClick={importBackup}>
              {t("button.import")}
            </Button>
          </div>
          <div
            css={css`
              font-size: 110%;
            `}
          >
            {message}
            {error && (
              <span
                css={css`
                  color: #cd4246;
                `}
              >
                ERROR: {error}
              </span>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
};

export const getStaticProps: GetStaticProps<InfoProps> = async (context) => {
  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common", "info"])),
    },
  };
};

export default Info;
