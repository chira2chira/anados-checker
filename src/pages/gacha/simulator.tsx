import { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import { Button, Checkbox, Tooltip } from "@blueprintjs/core";
import { css } from "@emotion/react";
import { CharInfo } from "..";
import { loadGachaMaster } from "@/utils/yamlUtil";
import { gacha } from "@/utils/gacha";
import { displayCharClass } from "@/utils/stringUtil";
import { Container } from "@/components/Container";
import { SelectBannerModal } from "@/components/SelectBannerModal";
import { RateListModal } from "@/components/RateListModal";
import { sendEvent } from "@/utils/gtag";

type CharWeight = {
  id: number;
  weight: number;
};

export type GachaInfo = {
  id: number;
  nameJa: string;
  nameEn: string;
  start: string;
  end: string;
  weight: Array<{
    rarity: number;
    weight: number;
  }>;
  pickUp: Array<{
    name: string;
    weight: number;
  }>;
  rarity6: string[];
  rarity5: string[];
  rarity4: string[];
  rarity3: string[];
  pool: CharWeight[];
};

type GachaSimulatorProps = {
  charInfo: CharInfo[];
  gachaInfo: GachaInfo[];
};

type CharInfoPu = CharInfo & {
  pickUp: boolean;
};

function getBanner(gachaInfo: GachaInfo[], id: any) {
  if (typeof id === "string") {
    const b = gachaInfo.find((x) => x.id.toString() === id);
    if (b !== undefined) return b;
  }
  return gachaInfo[gachaInfo.length - 1];
}

const GachaSimulator: NextPage<GachaSimulatorProps> = (props) => {
  const router = useRouter();
  const { id } = router.query;
  const banner = getBanner(props.gachaInfo, id);
  const [openSelectBanner, setOpenSelectBanner] = useState(false);
  const [openRateList, setOpenRateList] = useState(false);
  const [highlightPu, setHighlightPu] = useState(false);
  const [pullResult, setPullResult] = useState<CharInfoPu[]>([]);
  const [pullHistory, setPullHistory] = useState<CharInfoPu[]>([]);
  const { t, i18n } = useTranslation("gacha");
  const isJa = i18n.language === "ja";

  useEffect(() => {
    handleClear();
  }, [banner.id]);

  function getRarityPer(rarity: number) {
    const per =
      pullHistory.filter((x) => x.rarity === rarity).length /
      pullHistory.length;
    if (isNaN(per)) return "-";

    return Math.round(per * 1000) / 10;
  }

  function getPuPer() {
    const per = pullHistory.filter((x) => x.pickUp).length / pullHistory.length;
    if (isNaN(per)) return "-";

    return Math.round(per * 1000) / 10;
  }

  function nPull(n: number) {
    sendEvent({
      action: "pull",
      category: "gacha",
      label: banner.id.toString(),
      value: n.toString(),
    });
    const pullChar = [...Array(n)]
      .map((_) => gacha(banner))
      .map((x) => props.charInfo.find((y) => y.id === x)!);
    return pullChar.map((x) => ({
      ...x,
      pickUp: banner.pickUp.map((x) => x.name).includes(x.nameJa),
    }));
  }

  const handle1pull = () => {
    const result = nPull(1);

    setPullResult(result);
    setPullHistory(pullHistory.concat(result));
  };

  const handle10pull = () => {
    const result = nPull(10);

    setPullResult(result);
    setPullHistory(pullHistory.concat(result));
  };

  const handleClear = () => {
    setPullResult([]);
    setPullHistory([]);
  };

  const handleOpenSelectBanner = () => {
    setOpenSelectBanner(true);
  };

  const handleCloseSelectBanner = () => {
    setOpenSelectBanner(false);
  };

  const handleChangeBanner = (gacha: GachaInfo) => {
    // idの指定がない場合、最新のBannerになるためgetBannerした結果と比較
    if (banner.id !== gacha.id) {
      router.push({ query: { id: gacha.id } });
    } else if (id === undefined) {
      router.replace({ query: { id: gacha.id } });
    }
    handleCloseSelectBanner();
  };

  return (
    <Container title={t("title")} titleLink="/gacha/simulator">
      <div
        css={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 30px;
          max-width: 480px;
        `}
      >
        <img
          css={css`
            max-width: 100%;
            margin-bottom: 2px;
          `}
          src={`/static/image/banner/${isJa ? "ja" : "en"}/${banner.id}.png`}
          alt={isJa ? banner.nameJa : banner.nameEn}
        />
        <div
          css={css`
            display: flex;
            gap: 10px;
          `}
        >
          <Button
            onClick={() => setOpenRateList(true)}
            icon="lightbulb"
            outlined
          >
            {t("ui.button.rate")}
          </Button>
          <Button onClick={handleOpenSelectBanner} icon="refresh" outlined>
            {t("ui.button.changeBanner")}
          </Button>
        </div>
      </div>

      <div
        css={css`
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        `}
      >
        <Button onClick={handle1pull} intent="primary">
          {t("ui.button.pull1")}
        </Button>
        <Button onClick={handle10pull} intent="primary">
          {t("ui.button.pull10")}
        </Button>
        <Button onClick={handleClear}>{t("ui.button.clear")}</Button>
      </div>

      <div
        css={css`
          margin-bottom: 10px;
        `}
      >
        {t("ui.text.pullCount")}: {pullHistory.length} ({t("ui.text.usedStone")}
        : {pullHistory.length * 4}
        )<br />
        ★6: {getRarityPer(6)}%, ★5: {getRarityPer(5)}%, PU: {getPuPer()}%
      </div>

      {pullHistory.length !== 0 && (
        <>
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 3px;
              margin-bottom: 20px;
              padding: 8px;
              border: 1px solid #454545;
              background-color: #252a31;
            `}
          >
            {pullResult.map((x, i) => (
              <CharacterImage
                key={`${i}:${x.id}`}
                highlightPu={highlightPu}
                char={x}
              />
            ))}
          </div>
          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 10px;
              width: 100%;
              margin-bottom: 10px;
            `}
          >
            <HistoryArea
              rarity={6}
              highlightPu={highlightPu}
              pullHistory={pullHistory}
            />
            <HistoryArea
              rarity={5}
              highlightPu={highlightPu}
              pullHistory={pullHistory}
            />
            <HistoryArea
              rarity={4}
              highlightPu={highlightPu}
              pullHistory={pullHistory}
            />
            <HistoryArea
              rarity={3}
              highlightPu={highlightPu}
              pullHistory={pullHistory}
            />
          </div>

          <div
            css={css`
              display: flex;
              justify-content: flex-start;
            `}
          >
            <Checkbox
              checked={highlightPu}
              label={t("ui.button.highlightPu")}
              onClick={() => setHighlightPu(!highlightPu)}
            />
          </div>
        </>
      )}

      <RateListModal
        isOpen={openRateList}
        gachaInfo={banner}
        charInfo={props.charInfo}
        onClose={() => setOpenRateList(false)}
      />
      <SelectBannerModal
        isOpen={openSelectBanner}
        gachaInfo={props.gachaInfo}
        onSelect={handleChangeBanner}
        onClose={handleCloseSelectBanner}
      />
    </Container>
  );
};

type HistoryAreaProps = {
  rarity: number;
  highlightPu: boolean;
  pullHistory: CharInfoPu[];
};

const HistoryArea: React.FC<HistoryAreaProps> = (props) => {
  const charList = props.pullHistory.filter((x) => x.rarity === props.rarity);
  const uniqueCharList = charList.filter(
    (x, i, arr) => arr.map((x) => x.id).indexOf(x.id) === i
  );
  return (
    <div>
      <div>
        {[...Array(props.rarity)].map((_, i) => (
          <img
            key={i}
            src="/static/image/common/star.png"
            alt="star"
            width="15px"
            height="15px"
          />
        ))}
      </div>
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
        `}
      >
        {uniqueCharList.map((y) => (
          <CharacterImage
            key={y.id}
            char={y}
            highlightPu={props.highlightPu}
            count={charList.filter((x) => x.id === y.id).length}
          />
        ))}
      </div>
    </div>
  );
};

type CharacterImageProps = {
  char: CharInfoPu;
  highlightPu: boolean;
  count?: number;
};

function getRarityColor(rarity: number) {
  switch (rarity) {
    case 6:
      return "#FF7F00";
    case 5:
      return "#E5CA14";
    case 4:
      return "#7F2163";
    default:
      return "#0048A3";
  }
}

const CharacterImage: React.FC<CharacterImageProps> = (props) => {
  const { char } = props;
  const { i18n } = useTranslation();

  const charName = i18n.language === "ja" ? char.nameJa : char.nameEn;
  return (
    <Tooltip minimal compact content={charName} position="bottom">
      <div
        css={css`
          position: relative;
          padding: 3px;
          border-radius: 2px;
          background-color: ${getRarityColor(char.rarity)};
          line-height: 0;
          opacity: ${props.highlightPu && !props.char.pickUp ? 0.4 : 1};
        `}
      >
        <img
          src={"/static/image/char/" + char.image}
          width="54px"
          height="54px"
          alt={charName}
        />
        <img
          css={css`
            position: absolute;
            top: 3px;
            left: 3px;
            width: 18px;
            height: 18px;
            padding: 2px;
            background: rgba(0, 0, 0, 0.7);
          `}
          src={"/static/image/class/" + char.class + ".png"}
          alt={displayCharClass(char.class)}
        />
        {props.count && props.count > 1 && (
          <div
            css={css`
              position: absolute;
              bottom: 15px;
              right: 4px;
              font-size: 24px;
              font-weight: 700;
              color: #000000;
              text-shadow: 0 0 4px #ffffff, 0 0 4px #ffffff;
            `}
          >
            {props.count}
          </div>
        )}
        {char.pickUp && (
          <img
            css={css`
              position: absolute;
              top: -2px;
              right: -3px;
            `}
            src={"/static/image/common/pu.svg"}
            alt="Pick-Up"
            width="40px"
            height="14px"
          />
        )}
      </div>
    </Tooltip>
  );
};

export const getStaticProps: GetStaticProps<GachaSimulatorProps> = async (
  context
) => {
  const { charInfo, gachaInfo } = loadGachaMaster();

  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common", "gacha"])),
      charInfo,
      gachaInfo,
    },
  };
};

export default GachaSimulator;
