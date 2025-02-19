import { useTranslation } from "next-i18next";
import { Dialog, DialogBody, Tag } from "@blueprintjs/core";
import { css } from "@emotion/react";
import { GachaInfo } from "@/types/gacha";
import { UnknownInfo } from "@/types/unit";

type RateListModal = {
  isOpen: boolean;
  gachaInfo: GachaInfo;
  charInfo: UnknownInfo[];
  onClose: () => void;
};

export function calcPickUpRate(charInfo: UnknownInfo, gacha: GachaInfo) {
  let prevWeight = 0;
  for (const char of gacha.pool) {
    if (char.id === charInfo.id) {
      return Math.round((char.weight - prevWeight) * 10000) / 100;
    }
    prevWeight = char.weight;
  }
}

export const RateListModal: React.FC<RateListModal> = (props) => {
  const { t, i18n } = useTranslation("gacha");
  const isJa = i18n.language === "ja";

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={t("ui.button.rate")}
    >
      <DialogBody>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 10px;
            line-height: 150%;
          `}
        >
          <div>
            <h2>{t("ui.text.pickupRate")}</h2>
            <div>
              {props.gachaInfo.pickUp.map((x) => {
                const char = props.charInfo.find((y) => y.nameJa === x.name)!;
                return (
                  <div
                    key={char.id}
                    css={css`
                      display: flex;
                      align-items: flex-start;
                      flex-wrap: wrap;
                      gap: 5px;
                    `}
                  >
                    <span>★{char.rarity}</span>
                    <span>{isJa ? char.nameJa : char.nameEn}</span>
                    <RateSpan>
                      {calcPickUpRate(char, props.gachaInfo)}%
                    </RateSpan>
                    {char.limited && (
                      <Tag intent="warning" minimal>
                        {t("ui.text.limited")}
                      </Tag>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h2>{t("ui.text.standardRate")}</h2>
            <StandardRate
              rarity={6}
              charInfo={props.charInfo}
              gachaInfo={props.gachaInfo}
            />
            <StandardRate
              rarity={5}
              charInfo={props.charInfo}
              gachaInfo={props.gachaInfo}
            />
            <StandardRate
              rarity={4}
              charInfo={props.charInfo}
              gachaInfo={props.gachaInfo}
            />
            <StandardRate
              rarity={3}
              charInfo={props.charInfo}
              gachaInfo={props.gachaInfo}
            />
          </div>
        </div>
      </DialogBody>
    </Dialog>
  );
};

const RateSpan: React.FC<{ children: React.ReactNode }> = (props) => {
  return (
    <span
      css={css`
        color: #e76a6e;
        font-weight: 700;
      `}
    >
      {props.children}
    </span>
  );
};

type StandardRateProps = {
  rarity: number;
  charInfo: UnknownInfo[];
  gachaInfo: GachaInfo;
};

const StandardRate: React.FC<StandardRateProps> = (props) => {
  const { i18n } = useTranslation("gacha");
  const isJa = i18n.language === "ja";
  const weight = props.gachaInfo.weight.find(
    (x) => x.rarity === props.rarity
  )!.weight;
  const puWeight = props.gachaInfo.pickUp
    .filter(
      (x) =>
        props.charInfo.find((y) => y.nameJa === x.name!)!.rarity ===
        props.rarity
    )
    .reduce((a, c) => a + c.weight, 0);

  return (
    <div>
      <div
        css={css`
          margin-bottom: 5px;
        `}
      >
        <span>★{props.rarity}: </span>
        <RateSpan>{weight * 100}%</RateSpan>
        <span> {puWeight > 0 && `(PU +${puWeight * 100}%)`}</span>
      </div>
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
          gap: 0 4px;
          margin-bottom: 15px;
        `}
      >
        {props.gachaInfo.pool
          .map((x) => {
            const char = props.charInfo.find((y) => y.id === x.id);
            if (char === undefined || char.rarity !== props.rarity) return null;
            const isPu =
              props.gachaInfo.pickUp.filter((x) => x.name === char.nameJa)
                .length === 1;

            return (
              <span
                key={char.id}
                css={css`
                  color: ${isPu ? "#fbd065" : "inherit"};
                  font-weight: ${isPu ? "bold" : "inherit"};
                `}
              >
                {isJa ? char.nameJa : char.nameEn}
              </span>
            );
          })
          .filter((x) => x !== null)
          .reduce<React.ReactNode[]>((prev, curr, i) => {
            return [...prev, curr, <span key={i}>/</span>];
          }, [])
          .slice(0, -1)}
      </div>
    </div>
  );
};
