import { useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import { domToPng } from "modern-screenshot";
import { Button, Dialog, DialogBody, Switch } from "@blueprintjs/core";
import { css } from "@emotion/react";
import { CharacterArea, CharInfo, UnknownInfo } from "@/pages";
import { sendEvent } from "@/utils/gtag";

const BG_COLOR = "#111418";

type CaptureModal = {
  isOpen: boolean;
  charInfo: UnknownInfo[];
  displayChars: UnknownInfo[][];
  owned: number[];
  hideSpoiler: boolean;
  onClose: () => void;
};

export const CaptureModal: React.FC<CaptureModal> = (props) => {
  const [resetFilter, setResetFilter] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showHighRarityOnly, setShowHighRarityOnly] = useState(true);
  const [showOverall, setShowOverall] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("common");

  const chars = (
    resetFilter
      ? props.charInfo.map((x) => ({ ...x, owned: props.owned.includes(x.id) }))
      : props.displayChars.flat()
  ).filter((x) => !showHighRarityOnly || [5, 6].includes(x.rarity));
  const modalWidth =
    typeof document === "undefined"
      ? 10
      : document.documentElement.clientWidth * 0.9;
  const previewScale = modalWidth > 880 ? 0.9 : modalWidth / 880;

  const handleResetFilter = () => {
    setResetFilter(!resetFilter);
  };

  const handleShowHighRarityOnly = () => {
    setShowHighRarityOnly(!showHighRarityOnly);
  };

  const handleShowOverall = () => {
    setShowOverall(!showOverall);
  };

  const handleCharImageDownload = async () => {
    setConverting(true);
    const previewElm = previewRef.current!;
    const previewChildInfo = previewElm.firstElementChild!;

    const aElm = document.createElement("a");
    // iOSだと画像のfetchが上手くいかないことが多いため1回素振り
    await domToPng(previewElm, { features: { fixSvgXmlDecode: false } });
    aElm.href = await domToPng(previewElm, {
      width: previewChildInfo.clientWidth,
      height: previewChildInfo.clientHeight,
      backgroundColor: BG_COLOR,
      features: {
        fixSvgXmlDecode: false, // iOSのパフォーマンス向上
      },
    });
    aElm.setAttribute(
      "download",
      "anadoschars_" + new Date().getTime() + ".png"
    );
    aElm.click();

    setConverting(false);

    sendEvent({
      action: "download",
      category: "character",
      label: "success",
    });
  };

  const fitWrapper = () => {
    if (wrapperRef.current === null || previewRef.current === null) return;
    const wrapperElm = wrapperRef.current;
    const previewInfo =
      previewRef.current.firstElementChild!.getBoundingClientRect();

    wrapperElm.style.width = previewInfo.width + "px";
    wrapperElm.style.height = previewInfo.height + "px";
  };

  useEffect(() => {
    fitWrapper();
  }, [resetFilter, showHighRarityOnly, showOverall]);

  return (
    <Dialog
      isOpen={props.isOpen}
      onOpened={fitWrapper}
      onClose={props.onClose}
      title={t("ui.button.downloadScreenshot")}
      style={{ minWidth: "90vw" }}
    >
      <DialogBody>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            line-height: 150%;
          `}
        >
          <div>
            <Button
              intent="primary"
              large
              onClick={handleCharImageDownload}
              loading={converting}
            >
              {t("ui.button.download")}
            </Button>
          </div>
          <div>
            {props.charInfo.length !== props.displayChars.flat().length && (
              <Switch checked={resetFilter} onChange={handleResetFilter}>
                {t("ui.filter.resetFilter")}
              </Switch>
            )}
            <Switch
              checked={showHighRarityOnly}
              onChange={handleShowHighRarityOnly}
            >
              {t("ui.filter.showHighRarityOnly")}
            </Switch>
            <Switch checked={showOverall} onChange={handleShowOverall}>
              {t("ui.filter.showOverall")}
            </Switch>
          </div>
          <div
            ref={wrapperRef}
            css={css`
              position: relative;
              border: 1px dotted white;
              background-color: ${BG_COLOR};
            `}
          >
            <div
              css={css`
                transform: scale(${previewScale});
                transform-origin: top left;
              `}
            >
              <div ref={previewRef}>
                <Preview
                  chars={chars}
                  totalChars={props.charInfo.length}
                  owned={props.owned}
                  showOverall={showOverall}
                />
              </div>
            </div>
            <div
              css={css`
                position: absolute;
                top: -0.9em;
                right: 0;
                left: 0;
                text-shadow: 1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000,
                  -1px -1px 0 #000;
                text-align: center;
                font-size: 95%;
              `}
            >
              PREVIEW
            </div>
          </div>
        </div>
      </DialogBody>
    </Dialog>
  );
};

type PreviewProps = {
  chars: UnknownInfo[];
  totalChars: number;
  owned: number[];
  showOverall: boolean;
};

function doNothing() {}

const Preview: React.FC<PreviewProps> = (props) => {
  const { t } = useTranslation("common");

  return (
    <>
      <div
        className="image-preview"
        css={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 850px;
          padding: 15px;
        `}
      >
        {Array.from({ length: 8 })
          .map((_, i) => (
            <CharacterArea
              key={i}
              rarity={i}
              charInfo={props.chars.filter((x) => x.rarity === i)}
              hideSpoiler={true}
              hideCheckBUtton={true}
              onCharClick={doNothing}
              onBulkRegister={doNothing}
            />
          ))
          .reverse()}

        {props.showOverall && (
          <div
            css={css`
              padding: 10px 15px;
              border-radius: 5px;
              display: flex;
              flex-direction: column;
              align-items: center;
              color: #d3d8de;
              bottom: 20px;
              background: rgba(17, 20, 24, 0.7);
            `}
          >
            {t("ui.text.overall")}
            <div
              css={css`
                color: #fff;
                font-size: 200%;
                font-weight: 600;
              `}
            >
              {Math.round((props.owned.length / props.totalChars) * 100)}%
            </div>
            <span>
              {props.owned.length} / {props.totalChars}
            </span>
          </div>
        )}
        <div
          css={css`
            width: 100%;
            text-align: right;
            font-size: 80%;
          `}
        >
          <span>{t("title")}</span>
          <br />
          <span>https://anados-collection-tracker.vercel.app/</span>
        </div>
      </div>
    </>
  );
};
