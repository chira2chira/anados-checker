import { useTranslation } from "react-i18next";
import { Dialog, DialogBody } from "@blueprintjs/core";
import { css } from "@emotion/react";
import { GachaInfo } from "@/pages/gacha/simulator";
import dayjs from "dayjs";

type SelectBannerModal = {
  isOpen: boolean;
  gachaInfo: GachaInfo[];
  onSelect: (gacha: GachaInfo) => void;
  onClose: () => void;
};

export const SelectBannerModal: React.FC<SelectBannerModal> = (props) => {
  const { t, i18n } = useTranslation("gacha");
  const isJa = i18n.language === "ja";

  return (
    <Dialog isOpen={props.isOpen} onClose={props.onClose}>
      <DialogBody>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 15px;
          `}
        >
          {[...props.gachaInfo].reverse().map((x) => (
            <a
              key={x.id}
              onClick={() => props.onSelect(x)}
              css={css`
                display: flex;
                flex-direction: row;
              `}
            >
              <div
                css={css`
                  margin-left: -4px;
                  margin-right: 5px;
                  width: 8px;
                  border-radius: 4px;
                  background-color: #738091;
                `}
              />
              <div>
                <div
                  css={css`
                    margin-left: 3px;
                  `}
                >
                  {isJa ? x.nameJa : x.nameEn}
                  <br />
                  {dayjs(x.start).format("YYYY/M/D")}
                  {" - "}
                  {dayjs(x.end).format("YYYY/M/D")}
                </div>
                <img
                  css={css`
                    max-width: 100%;
                  `}
                  src={`/static/image/banner/${isJa ? "ja" : "en"}/${x.id}.png`}
                  alt={isJa ? x.nameJa : x.nameEn}
                />
              </div>
            </a>
          ))}
        </div>
      </DialogBody>
    </Dialog>
  );
};
