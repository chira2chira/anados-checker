import { GetStaticProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ChangeEventHandler, useRef, useState } from "react";
import { css } from "@emotion/react";
import { Button } from "@blueprintjs/core";
import { Container } from "@/components/Container";
import { sendEvent } from "@/utils/gtag";

const CHAR_KEY = "chars";
const STILL_KEY = "still";

type BackupData = {
  version: Number;
  char: string | null;
  still: string | null;
};

type BackupProps = {};

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

const Backup: NextPage<BackupProps> = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("info");

  const exportBackup = () => {
    setError("");
    const storedCharValue = window.localStorage.getItem(CHAR_KEY);
    const storedStillValue = window.localStorage.getItem(STILL_KEY);
    if (!storedCharValue && !storedStillValue) {
      return setError(t("message.e_dataNotFound"));
    }

    const data: BackupData = {
      version: 1,
      char: storedCharValue,
      still: storedStillValue,
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
    if (!!json.still) {
      imported.push(t("message.still"));
      window.localStorage.setItem(STILL_KEY, json.still);
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
      titleLink="/backup"
      title={t("title")}
      description={t("description")}
    >
      <div
        css={css`
          margin-bottom: 20px;
        `}
      >
        {t("message.backupOverview")}
      </div>
      <div
        css={css`
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        `}
      >
        <Button large onClick={exportBackup}>
          {t("button.export")}
        </Button>
        <input
          ref={inputFileRef}
          style={{ display: "none" }}
          type="file"
          accept=".json"
          onChange={handleFileChange}
        />
        <Button large onClick={importBackup}>
          {t("button.import")}
        </Button>
      </div>
      <div
        css={css`
          margin-bottom: 40lvh;
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
    </Container>
  );
};

export const getStaticProps: GetStaticProps<BackupProps> = async (context) => {
  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common", "info"])),
    },
  };
};

export default Backup;
