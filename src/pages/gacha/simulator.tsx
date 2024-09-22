import { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Tooltip } from "@blueprintjs/core";
import { css } from "@emotion/react";
import type { CharInfo } from "..";
import { loadGachaMaster } from "@/utils/yamlUtil";
import { gacha } from "@/utils/gacha";
import { displayCharClass } from "@/utils/stringUtil";
import { Container } from "@/components/Container";
import { SelectBannerModal } from "@/components/SelectBannerModal";
import { RateListModal, calcPickUpRate } from "@/components/RateListModal";
import { sendEvent } from "@/utils/gtag";

type CharWeight = {
  id: number;
  weight: number;
};

export type GachaInfo = {
  id: number;
  nameJa: string;
  nameEn: string;
  revival: boolean;
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

const winStyle = css`
  color: #fbd065;
  font-weight: 600;
`;

const loseStyle = css`
  color: #d69fd6;
  font-weight: 600;
`;

function getBanner(gachaInfo: GachaInfo[], id: any) {
  if (typeof id === "string") {
    const b = gachaInfo.find((x) => x.id.toString() === id);
    if (b !== undefined) return b;
  }
  // 未指定時は復刻を除外した最新のガチャにする
  return gachaInfo.filter((x) => !x.revival).slice(-1)[0];
}

function formatRate(num: number, showSymbol?: boolean) {
  // 小数点1桁表示
  const result = Math.round(num * 1000) / 10;
  const symbol = showSymbol && result >= 0 ? "+" : "";
  return symbol + result;
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
    if (isNaN(per)) return "-%";

    let rarityWeight = banner.weight.find((x) => x.rarity === rarity)!.weight;
    rarityWeight += banner.pickUp.reduce((prev, current) => {
      const char = props.charInfo.find((y) => y.nameJa === current.name)!;
      return prev + (char.rarity === rarity ? current.weight : 0);
    }, 0);

    return <ResultRate percent={per} weight={rarityWeight} />;
  }

  function getPuPer() {
    const per = pullHistory.filter((x) => x.pickUp).length / pullHistory.length;
    if (isNaN(per)) return "-%";

    return <ResultRate percent={per} weight={puWeight} />;
  }

  const puWeight = useMemo(
    () =>
      banner.pickUp.reduce((prev, current) => {
        const char = props.charInfo.find((y) => y.nameJa === current.name)!;
        return prev + calcPickUpRate(char, banner)! / 100;
      }, 0),
    [banner, props.charInfo]
  );

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
    <Container
      title={t("title")}
      description={t("description")}
      titleLink="/gacha/simulator"
    >
      <div
        css={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 30px;
          max-width: 55em;
        `}
      >
        <Image
          key={Number(isJa) + ":" + banner.id}
          css={css`
            max-width: 100%;
            height: auto;
            margin-bottom: 2px;
          `}
          priority
          src={`/static/image/banner/${isJa ? "ja" : "en"}/main/${
            banner.id
          }.png`}
          placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAwIAAAGxAgMAAACsE+nZAAAAAXNSR0IArs4c6QAAAAxQTFRFR3BMpaiqpaiqpaiqm8gleQAAAAN0Uk5TADzFYouLHgAAAV5JREFUeNrt2iFOQ0EUhtF5TQCBx1R0CWzhLQGDRqO6hLKECpaAYhG8LbAERBW6goq+n5SkKVggaW56jhr7ZXIz4k4DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPiN7vmHp4IFQ75bKVBwmgXvzwdDyYJlO5gXLejKF1w9Vi+Yb6oXDNvqBRn72gVdxt4dHHsOyk/y9Xp3uilccHazOzxVf5PPN4ULvkzHvnjBXaoXLPJau6BLVoUL7lubJB+FC15au0y2dQu6sW+zJH3ZgvMs2yLJsmzBNKtuSPJWtmCW9SRJ1mULFtleJMm2akE3ZLxLkrEvWjDJXtWCi+w9FC2Yli+YlS+4zl5fvuBBwZEKzm732tz+QMHft1A2gQoUKFCgQIECBQoUKFCg4B8L/LsGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE7UJ+JvXqZOadVdAAAAAElFTkSuQmCC"
          alt={isJa ? banner.nameJa : banner.nameEn}
          width={770}
          height={433}
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
          gap: 40px;
          justify-content: space-between;
          margin-bottom: 8px;
        `}
      >
        <Button onClick={handleClear}>{t("ui.button.clear")}</Button>
        <div
          css={css`
            display: flex;
            gap: 12px;
          `}
        >
          <Button onClick={handle1pull} intent="primary">
            {t("ui.button.pull1")}
          </Button>
          <Button onClick={handle10pull} intent="primary">
            {t("ui.button.pull10")}
          </Button>
        </div>
      </div>

      <div
        css={css`
          margin-bottom: 10px;
        `}
      >
        <div
          css={css`
            display: flex;
            align-items: center;
          `}
        >
          <span>
            {t("ui.text.pullCount")}: {pullHistory.length} (
            {t("ui.text.usedStone")}: {pullHistory.length * 4}
          </span>
          <img
            src="/static/image/common/stone.png"
            alt="龍脈石"
            width="15px"
            height="18px"
            style={{ margin: "0 3px 0 5px" }}
          />
          <span>)</span>
        </div>
        <span translate="no">
          ★6: {getRarityPer(6)}, ★5: {getRarityPer(5)}, PU: {getPuPer()}
        </span>
      </div>

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
        {pullResult.length === 0 && <NoData />}
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

const NoData: React.FC = () => {
  return (
    <div
      css={css`
        width: 100%;
        height: 60px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #919191;
      `}
    >
      NO DATA
    </div>
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
        {uniqueCharList.length === 0 && <NoData />}
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

const CharacterImage: React.FC<CharacterImageProps> = React.memo((props) => {
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
});
CharacterImage.displayName = "CharacterImage";

type ResultRateProps = {
  percent: number;
  weight: number;
};

const ResultRate: React.FC<ResultRateProps> = (props) => {
  const { percent, weight } = props;
  const { t } = useTranslation("gacha");

  const style = percent >= weight ? winStyle : loseStyle;
  return (
    <Tooltip
      minimal
      compact
      content={`${t("ui.text.expectation")} ${formatRate(
        percent - weight,
        true
      )}%`}
      position="bottom"
    >
      <span css={style}>{formatRate(percent)}%</span>
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
