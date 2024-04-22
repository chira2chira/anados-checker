import {
  RefObject,
  createRef,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
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
`;

export const SelectBannerModal: React.FC<SelectBannerModal> = (props) => {
  const router = useRouter();
  const [excludeRevival, setExcludeRevival] = useState(false);
  const { id } = router.query;
  const { t } = useTranslation("gacha");
  const bannerRefs = useRef<RefObject<HTMLAnchorElement>[]>([]);

  props.gachaInfo.forEach((x) => {
    bannerRefs.current[x.id] = createRef<HTMLAnchorElement>();
  });

  useEffect(() => {
    const bannerRef = bannerRefs.current[Number(id)];
    if (props.isOpen && !!bannerRef) {
      bannerRef.current?.scrollIntoView({
        block: "center",
      });
    }
  }, [props.isOpen, id]);

  return (
    <Dialog isOpen={props.isOpen} onClose={props.onClose}>
      <DialogBody>
        <div
          css={css`
            text-align: right;
          `}
        >
          <Checkbox
            css={css`
              margin-bottom: 3px;
            `}
            checked={excludeRevival}
            onChange={() => setExcludeRevival(!excludeRevival)}
          >
            {t("ui.filter.excludeRevival")}
          </Checkbox>
        </div>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 15px;
          `}
        >
          {[...props.gachaInfo]
            .reverse()
            .filter((x) => !excludeRevival || !x.revival)
            .map((x) => (
              <BannerLink
                ref={bannerRefs.current[x.id]}
                key={x.id}
                gachaInfo={x}
                onClick={props.onSelect}
              />
            ))}
        </div>
      </DialogBody>
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
            {isJa ? gachaInfo.nameJa : gachaInfo.nameEn}
            <br />
            {dayjs(gachaInfo.start).format("YYYY/M/D")}
            {" - "}
            {dayjs(gachaInfo.end).format("YYYY/M/D")}
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
