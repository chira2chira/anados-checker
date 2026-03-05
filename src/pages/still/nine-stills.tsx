import { GetStaticProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRef, useState } from "react";
import { css } from "@emotion/react";
import { Button } from "@blueprintjs/core";
import { domToPng } from "modern-screenshot";
import * as styles from "@/styles/Home.module";
import { CharInfoWithStill } from "@/types/unit";
import { StillInfo } from "@/types/still";
import { loadStillMaster } from "@/utils/yamlUtil";
import { Container } from "@/components/Container";
import { getImageUrl } from "@/utils/image";
import { TopToaster } from "@/utils/toast";
import { NineStillsSelectModal } from "@/components/NineStillsSelectModal";

type NineStillsProps = {
  charInfoWithStills: CharInfoWithStill[];
};

const gridStyle = css`
  display: grid;
  grid-template-columns: repeat(3, 288px);
  grid-template-rows: repeat(3, 176px); // 162px + 14px for label
  gap: 8px;
  margin: 0 auto 30px;

  @media (max-width: 992px) {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, auto);
    width: 100%;
    max-width: 600px;
  }
`;

const cellContainerStyle = css`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 3px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const emptyCellStyle = css`
  width: 100%;
  height: 100%;
  background-color: #1c2127;
  border: 2px dashed #394b59;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #252a31;
    border-color: #5c7080;
  }
`;

const clearButtonStyle = css`
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.6) !important;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8) !important;
  }
`;

const previewContainerStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
`;

const previewImageStyle = css`
  max-width: 100%;
  border: 2px dashed #5f6b7c;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
`;

const captureOffscreenStyle = css`
  position: absolute;
  left: -9999px;
  top: 0;
`;

const captureInnerStyle = css`
  padding: 20px;
  display: inline-block;
`;

const captureTitleStyle = css`
  color: #ffffff;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
`;

const captureGridStyle = css`
  display: grid;
  grid-template-columns: repeat(3, 288px);
  gap: 8px;
`;

const captureCellStyle = css`
  display: flex;
  flex-direction: column;
`;

const captureLabelStyle = css`
  font-size: 12px;
  text-align: center;
  padding: 4px 2px;
  color: #d3d8de;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NineStills: NextPage<NineStillsProps> = (props) => {
  const [selectedStills, setSelectedStills] = useState<(StillInfo | null)[]>(
    Array(9).fill(null),
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation("common");
  const { t: t2 } = useTranslation("nine-stills");

  const selectedStillIds = selectedStills
    .filter((x): x is StillInfo => x !== null)
    .map((x) => x.id);

  const handleOpenModal = (index: number) => {
    setSelectedIndex(index);
    setModalOpen(true);
  };

  const handleSelectStill = (still: StillInfo) => {
    if (selectedIndex === null) return;

    const newSelectedStills = [...selectedStills];
    newSelectedStills[selectedIndex] = still;
    setSelectedStills(newSelectedStills);
    setSelectedIndex(null);
  };

  const handleClear = (index: number) => {
    const newSelectedStills = [...selectedStills];
    newSelectedStills[index] = null;
    setSelectedStills(newSelectedStills);
  };

  const getStillLabel = (still: StillInfo) => {
    const char = props.charInfoWithStills.find((c) =>
      c.stills.some((s) => s.id === still.id),
    );
    const charName = i18n.language === "ja" ? char?.nameJa : char?.nameEn;
    return char ? `${charName} - ${still.label}` : still.label;
  };

  const handleGenerateImage = async () => {
    const selectedCount = selectedStills.filter((x) => x !== null).length;

    if (selectedCount === 0) {
      TopToaster?.then((toaster) =>
        toaster.show({
          intent: "warning",
          message: t2("message.selectAtLeastOne"),
        }),
      );
      return;
    }

    if (!captureRef.current) return;

    setIsGenerating(true);

    TopToaster?.then((toaster) =>
      toaster.show({
        intent: "primary",
        message: t2("message.generating"),
      }),
    );

    try {
      // iOS向けウォームアップ
      await domToPng(captureRef.current, {
        features: { fixSvgXmlDecode: false },
      });
      const dataUrl = await domToPng(captureRef.current, {
        backgroundColor: "#111418",
        features: { fixSvgXmlDecode: false },
      });

      setGeneratedImageUrl(dataUrl);

      TopToaster?.then((toaster) =>
        toaster.show({
          intent: "success",
          message: t2("message.generated"),
        }),
      );
    } catch (error) {
      console.error("Image generation failed:", error);
      TopToaster?.then((toaster) =>
        toaster.show({
          intent: "danger",
          message: t2("message.failed"),
        }),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareOnX = () => {};

  const handleDownload = () => {
    if (!generatedImageUrl) return;

    const link = document.createElement("a");
    link.href = generatedImageUrl;
    link.download = `nine-stills-${Date.now()}.png`;
    link.click();
  };

  return (
    <Container
      titleLink="/still/nine-stills"
      title={t2("title")}
      description={t2("description")}
    >
      <div css={styles.main}>
        <div css={gridStyle}>
          {selectedStills.map((still, index) => (
            <div key={index}>
              {still ? (
                <div css={cellContainerStyle}>
                  <div>
                    <img
                      src={getImageUrl("still/" + still.image)}
                      alt={still.label}
                    />
                    <div css={{ fontSize: "0.8em", textAlign: "center" }}>
                      {getStillLabel(still)}
                    </div>
                  </div>
                  <Button
                    icon="cross"
                    minimal
                    small
                    css={clearButtonStyle}
                    onClick={() => handleClear(index)}
                  />
                </div>
              ) : (
                <Button
                  icon="plus"
                  large
                  minimal
                  css={emptyCellStyle}
                  onClick={() => handleOpenModal(index)}
                />
              )}
            </div>
          ))}
        </div>

        <div
          css={css`
            display: flex;
            gap: 10px;
            align-items: center;
          `}
        >
          <Button
            onClick={handleGenerateImage}
            intent="primary"
            size="large"
            loading={isGenerating}
            disabled={isGenerating}
          >
            {t2("button.generateImage")}
          </Button>
          <Button onClick={handleShareOnX} disabled={!generatedImageUrl}>
            {t2("button.shareOnX")}
          </Button>
        </div>

        {generatedImageUrl && (
          <div css={previewContainerStyle}>
            <img
              src={generatedImageUrl}
              alt="Generated"
              css={previewImageStyle}
            />
            <Button intent="success" icon="download" onClick={handleDownload}>
              {t2("button.download")}
            </Button>
          </div>
        )}
      </div>

      {/* キャプチャ用オフスクリーンコンテナ */}
      <div css={captureOffscreenStyle}>
        <div ref={captureRef} css={captureInnerStyle}>
          <div css={captureTitleStyle}>{t2("title")}</div>
          <div css={captureGridStyle}>
            {selectedStills.map((still, index) => (
              <div key={index} css={captureCellStyle}>
                {still ? (
                  <>
                    <img
                      css={css`
                        width: 288px;
                        height: 162px;
                        object-fit: cover;
                        display: block;
                        border-radius: 3px;
                      `}
                      src={getImageUrl("still/" + still.image)}
                      alt={still.label}
                    />
                    <div css={captureLabelStyle}>{getStillLabel(still)}</div>
                  </>
                ) : (
                  <div
                    css={css`
                      width: 288px;
                      height: 162px;
                      background-color: #252a31;
                      border-radius: 3px;
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <NineStillsSelectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedIndex(null);
        }}
        onSelect={handleSelectStill}
        charInfoWithStills={props.charInfoWithStills}
        selectedStillIds={selectedStillIds}
      />
    </Container>
  );
};

export const getStaticProps: GetStaticProps<NineStillsProps> = async (
  context,
) => {
  const { charInfoWithStills } = loadStillMaster();

  return {
    props: {
      ...(await serverSideTranslations(context.locale!, [
        "common",
        "nine-stills",
      ])),
      charInfoWithStills,
    },
  };
};

export default NineStills;
