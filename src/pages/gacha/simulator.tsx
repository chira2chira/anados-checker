import { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { UrlObject } from "url";
import React, { useEffect, useMemo, useState } from "react";
import { Button, ButtonGroup, Checkbox, Tooltip } from "@blueprintjs/core";
import { css, keyframes } from "@emotion/react";
import { CharInfo, EidosInfo, UnknownInfo } from "@/types/unit";
import { GachaInfo } from "@/types/gacha";
import { loadEidosGachaMaster, loadGachaMaster } from "@/utils/yamlUtil";
import { gacha } from "@/utils/gacha";
import { displayCharClass } from "@/utils/stringUtil";
import { Container } from "@/components/Container";
import { SelectBannerModal } from "@/components/SelectBannerModal";
import { RateListModal, calcPickUpRate } from "@/components/RateListModal";
import { sendEvent } from "@/utils/gtag";
import { isCharInfo, isEidosInfo } from "@/utils/types";
import useCategoryQuery, { PageCategory } from "@/hooks/useCategoryQuery";

type GachaSimulatorProps = {
  charInfo: CharInfo[];
  eidosInfo: EidosInfo[];
  gachaInfo: GachaInfo[];
  eidosGachaInfo: GachaInfo[];
};

type CharInfoPu = UnknownInfo & {
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

function formatCharPer(num: number) {
  // 小数点2桁表示
  const result = (Math.round(num * 10000) / 100).toFixed(2);
  return result;
}

const GachaSimulator: NextPage<GachaSimulatorProps> = (props) => {
  const router = useRouter();
  const { id } = router.query;
  const [openSelectBanner, setOpenSelectBanner] = useState(false);
  const [openRateList, setOpenRateList] = useState(false);
  const [showCharPer, setShowCharPer] = useState(false);
  const [highlightPu, setHighlightPu] = useState(false);
  const [pullResult, setPullResult] = useState<CharInfoPu[]>([]);
  const [pullHistory, setPullHistory] = useState<CharInfoPu[]>([]);
  const category = useCategoryQuery();
  const currentInfo: UnknownInfo[] =
    category === "char" ? props.charInfo : props.eidosInfo;
  const currentGachaInfo =
    category === "char" ? props.gachaInfo : props.eidosGachaInfo;
  const banner = getBanner(currentGachaInfo, id);
  const basePath = isCharInfo(currentInfo[0])
    ? "/static/image/banner/"
    : "/static/image/banner_eidos/";
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
      const char = currentInfo.find((y) => y.nameJa === current.name)!;
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
        const char = currentInfo.find((y) => y.nameJa === current.name)!;
        return prev + calcPickUpRate(char, banner)! / 100;
      }, 0),
    [banner, currentInfo]
  );

  function nPull(n: number) {
    sendEvent({
      action: "pull",
      category: "gacha",
      label: category + "_" + banner.id.toString(),
      value: n.toString(),
    });
    const pullChar = [...Array(n)]
      .map((_) => gacha(banner))
      .map((x) => currentInfo.find((y) => y.id === x)!);
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
    const url: UrlObject = {
      pathname: router.pathname,
      query: { cat: category, id: gacha.id },
    };
    // idの指定がない場合、最新のBannerになるためgetBannerした結果と比較
    if (banner.id !== gacha.id) {
      router.push(url, undefined, { scroll: false });
    } else if (id === undefined) {
      router.replace(url);
    }
    handleCloseSelectBanner();
  };

  return (
    <Container
      title={t("title")}
      description={t("description")}
      titleLink="/gacha/simulator"
    >
      <ButtonGroup
        css={css`
          margin-bottom: 40px;
        `}
      >
        <SwitchButton currentCategory={category} linkCategory="char" />
        <SwitchButton currentCategory={category} linkCategory="eidos" />
      </ButtonGroup>

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
            margin-bottom: 8px;
          `}
          priority
          src={basePath + `${isJa ? "ja" : "en"}/main/${banner.id}.png`}
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
            key={`${i}:${pullHistory.length}`}
            highlightPu={highlightPu}
            showCharPer={false}
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
          showCharPer={showCharPer}
          pullHistory={pullHistory}
        />
        <HistoryArea
          rarity={5}
          highlightPu={highlightPu}
          showCharPer={showCharPer}
          pullHistory={pullHistory}
        />
        <HistoryArea
          rarity={4}
          highlightPu={highlightPu}
          showCharPer={showCharPer}
          pullHistory={pullHistory}
        />
        <HistoryArea
          rarity={3}
          highlightPu={highlightPu}
          showCharPer={showCharPer}
          pullHistory={pullHistory}
        />
      </div>

      <div
        css={css`
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        `}
      >
        <Checkbox
          checked={showCharPer}
          label={t("ui.button.showCharPer")}
          onClick={() => setShowCharPer(!showCharPer)}
        />
        <Checkbox
          checked={highlightPu}
          label={t("ui.button.highlightPu")}
          onClick={() => setHighlightPu(!highlightPu)}
        />
      </div>

      <RateListModal
        isOpen={openRateList}
        gachaInfo={banner}
        charInfo={currentInfo}
        onClose={() => setOpenRateList(false)}
      />
      <SelectBannerModal
        isOpen={openSelectBanner}
        gachaInfo={currentGachaInfo}
        onSelect={handleChangeBanner}
        onClose={handleCloseSelectBanner}
      />
    </Container>
  );
};

type SwitchButtonProps = {
  currentCategory: PageCategory;
  linkCategory: PageCategory;
};

const SwitchButton: React.FC<SwitchButtonProps> = (props) => {
  const { t } = useTranslation("common");
  const { push } = useRouter();
  const label =
    props.linkCategory === "char"
      ? t("ui.button.character")
      : t("ui.button.eidos");

  const handleClick = () => {
    if (props.currentCategory === props.linkCategory) return;
    push({ query: { cat: props.linkCategory } });
  };

  return (
    <Button
      onClick={handleClick}
      intent={
        props.currentCategory === props.linkCategory ? "primary" : undefined
      }
    >
      {label}
    </Button>
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
  showCharPer: boolean;
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
        {uniqueCharList.map((y) => {
          const count = charList.filter((x) => x.id === y.id).length;
          const charPer = props.showCharPer
            ? count / props.pullHistory.length
            : 0; // メモ化しているため表示しないときは固定値
          return (
            <CharacterImage
              key={y.id}
              char={y}
              highlightPu={props.highlightPu}
              showCharPer={props.showCharPer}
              count={count}
              charPer={formatCharPer(charPer)}
            />
          );
        })}
      </div>
    </div>
  );
};

type CharacterImageProps = {
  char: CharInfoPu;
  highlightPu: boolean;
  showCharPer: boolean;
  count?: number;
  charPer?: string;
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
  const isJa = i18n.language === "ja";
  const basePath = isCharInfo(char)
    ? "/static/image/char/"
    : "/static/image/eidos/";

  let charName = isJa ? char.nameJa : char.nameEn;
  if (isEidosInfo(char)) {
    charName += isJa ? `（${char.unitNameJa}）` : ` (${char.unitNameEn})`;
  }

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
        <ShinyBox>
          <img
            src={basePath + char.image}
            width="54px"
            height="54px"
            alt={charName}
          />
        </ShinyBox>
        {isCharInfo(char) && (
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
        )}
        {props.count && (
          <div
            css={css`
              position: absolute;
              bottom: ${props.showCharPer ? "10px" : "15px"};
              right: 4px;
              font-size: ${props.showCharPer ? "16px" : "24px"};
              font-weight: 700;
              color: #000000;
              text-shadow: 0 0 4px #ffffff, 0 0 4px #ffffff;
            `}
          >
            {props.showCharPer
              ? props.charPer
              : props.count > 1
              ? props.count
              : ""}
          </div>
        )}
        {char.pickUp && <PickUpIcon />}
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

const shiny = keyframes`
    0% { transform: scale(0) rotate(45deg); opacity: 0; }
    1% { transform: scale(0) rotate(45deg); opacity: 0.4; }
    2% { transform: scale(4) rotate(45deg); opacity: 0.8; }
    100% { transform: scale(50) rotate(45deg); opacity: 0; }
`;

const ShinyBox: React.FC<{ children: React.ReactNode }> = (props) => {
  return (
    <div
      css={css`
        margin: -3px;
        padding: 3px;
        position: relative;
        overflow: hidden;

        &::before {
          position: absolute;
          content: "";
          display: inline-block;
          top: -180px;
          left: 0;
          width: 20px;
          height: 100%;
          background-color: #ffffff;
          animation: 0.8s ${shiny} ease-in-out;
        }
      `}
    >
      {props.children}
    </div>
  );
};

const popup = keyframes`
    0% { transform: scale(1) rotate(0); }
    20% { transform: scale(1.8, 1.6) rotate(10deg) translateY(-2px); }
    100% { transform: scale(1) rotate(0); }
`;

const PickUpIcon: React.FC = () => {
  return (
    <img
      css={css`
        position: absolute;
        top: -2px;
        right: -3px;
        animation: 0.5s ${popup} ease-in-out;
        z-index: 1;
      `}
      src={"/static/image/common/pu.svg"}
      alt="Pick-Up"
      width="40px"
      height="14px"
    />
  );
};

export const getStaticProps: GetStaticProps<GachaSimulatorProps> = async (
  context
) => {
  const { charInfo, gachaInfo } = loadGachaMaster();
  const { eidosInfo, gachaInfo: eidosGachaInfo } = loadEidosGachaMaster();

  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common", "gacha"])),
      charInfo,
      eidosInfo,
      gachaInfo,
      eidosGachaInfo,
    },
  };
};

export default GachaSimulator;
