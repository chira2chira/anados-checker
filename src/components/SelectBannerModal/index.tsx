import { RefObject, createRef, forwardRef, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { Checkbox, Dialog, DialogBody, Tag } from "@blueprintjs/core";
import { css } from "@emotion/react";
import { GachaInfo } from "@/pages/gacha/simulator";
import dayjs from "dayjs";

type SelectBannerModal = {
  isOpen: boolean;
  gachaInfo: GachaInfo[];
  onSelect: (gacha: GachaInfo) => void;
  onClose: () => void;
};

const leftLine = css`
  margin-left: -4px;
  margin-right: 5px;
  width: 3px;
  border-radius: 4px;
  background-color: #738091;
  flex-shrink: 0;
`;

export const SelectBannerModal: React.FC<SelectBannerModal> = (props) => {
  const router = useRouter();
  const [includeNew, setIncludeNew] = useState(true);
  const [includeRevival, setIncludeRevival] = useState(true);
  const [includeEnded, setIncludeEnded] = useState(true);
  const { id } = router.query;
  const { t } = useTranslation("gacha");
  const bannerRefs = useRef<RefObject<HTMLAnchorElement>[]>([]);

  props.gachaInfo.forEach((x) => {
    bannerRefs.current[x.id] = createRef<HTMLAnchorElement>();
  });

  const filteredBanner = [...props.gachaInfo]
    .reverse()
    .filter((x) => includeNew || x.revival)
    .filter((x) => includeRevival || !x.revival)
    .filter((x) => includeEnded || dayjs.tz().isBefore(dayjs(x.end).tz()));

  const scrollToCurrentBanner = () => {
    const bannerRef = bannerRefs.current[Number(id)];
    if (!!bannerRef) {
      bannerRef.current?.scrollIntoView({
        block: "center",
      });
    }
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onOpening={scrollToCurrentBanner}
      onClose={props.onClose}
    >
      <DialogBody>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 15px;
          `}
        >
          {filteredBanner.map((x) => (
            <BannerLink
              ref={bannerRefs.current[x.id]}
              key={x.id}
              gachaInfo={x}
              onClick={props.onSelect}
            />
          ))}
          {filteredBanner.length === 0 && <div>{t("ui.text.notFound")}</div>}
        </div>
      </DialogBody>
      <div
        css={css`
          margin: 10px 12px;
        `}
      >
        <Checkbox
          css={css`
            margin-bottom: 0;
          `}
          inline
          checked={includeNew}
          onChange={() => setIncludeNew(!includeNew)}
        >
          {t("ui.text.new")}
        </Checkbox>
        <Checkbox
          css={css`
            margin-bottom: 0;
          `}
          inline
          checked={includeRevival}
          onChange={() => setIncludeRevival(!includeRevival)}
        >
          {t("ui.text.revival")}
        </Checkbox>
        <Checkbox
          css={css`
            margin-bottom: 0;
          `}
          inline
          checked={includeEnded}
          onChange={() => setIncludeEnded(!includeEnded)}
        >
          {t("ui.text.ended")}
        </Checkbox>
      </div>
    </Dialog>
  );
};

type BannerLinkProps = {
  gachaInfo: GachaInfo;
  onClick: (gachaInfo: GachaInfo) => void;
};
const BannerLink = forwardRef<HTMLAnchorElement, BannerLinkProps>(
  (props, ref) => {
    const { gachaInfo, onClick } = props;
    const { t, i18n } = useTranslation("gacha");
    const isJa = i18n.language === "ja";

    return (
      <a
        ref={ref}
        onClick={() => onClick(gachaInfo)}
        css={css`
          display: flex;
          flex-direction: row;

          &:hover ${".css-" + leftLine.name} {
            background-color: #68c1ee;
          }
        `}
      >
        <div css={leftLine} />
        <div>
          <div
            css={css`
              margin-left: 3px;
            `}
          >
            {gachaInfo.revival && (
              <Tag
                css={css`
                  margin-right: 5px;
                `}
              >
                {t("ui.text.revival")}
              </Tag>
            )}
            <span>{isJa ? gachaInfo.nameJa : gachaInfo.nameEn}</span>
            <br />
            {dayjs(gachaInfo.start).tz().format("YYYY/M/D")}
            {" - "}
            {dayjs(gachaInfo.end).tz().format("YYYY/M/D")}
          </div>
          <Image
            css={css`
              max-width: 100%;
              height: auto;
            `}
            src={`/static/image/banner/${isJa ? "ja" : "en"}/header/${
              gachaInfo.id
            }.png`}
            alt={isJa ? gachaInfo.nameJa : gachaInfo.nameEn}
            width={449}
            height={86}
          />
        </div>
      </a>
    );
  }
);
BannerLink.displayName = "BannerLink";
