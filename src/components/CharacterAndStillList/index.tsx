import React, { useContext, useState } from "react";
import LazyLoad from "react-lazyload";
import { css } from "@emotion/react";
import { useTranslation } from "next-i18next";
import { Button, Card, Icon, Tooltip } from "@blueprintjs/core";
import { dequal } from "dequal";
import { displayCharClass } from "@/utils/stringUtil";
import { getImageUrl } from "@/utils/image";
import { CharInfoWithStill } from "@/types/unit";
import UserLabelEmojiSelect from "../UserLabelEmojiSelect";
import { HideSpoilerContext } from "@/providers/HideSpoilerProvider";
import { CustomLabelContext } from "@/providers/CustomLabelProvider";

const SPOILER_CHARS = [143, 150];

type CharacterAndStillListProps = {
  characters: CharInfoWithStill[];
  gridMode: boolean;
  onReadChange: (id: string) => void;
  onRateChange: (id: string, rate: number) => void;
};

const CharacterAndStillList: React.FC<CharacterAndStillListProps> = (props) => {
  const { hideSpoiler } = useContext(HideSpoilerContext);

  return props.characters.map((x) => {
    const useSpoilerFilter = SPOILER_CHARS.includes(x.id) && hideSpoiler;

    return (
      <MemoizeCharacterPanel
        key={x.id}
        char={x}
        gridMode={props.gridMode}
        hideSpoiler={useSpoilerFilter}
        onReadChange={props.onReadChange}
        onRateChange={props.onRateChange}
      />
    );
  });
};

const card = css`
  padding: 3px;
  line-height: 0;
  border: none;
  border-radius: 2px;
  background-color: #fff !important;
  position: relative;
  opacity: 0.5;

  &.owned {
    opacity: 1;
  }
`;

const classIcon = css`
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  padding: 2px;
  background: rgba(0, 0, 0, 0.7);
`;

const CharacterPanel: React.FC<{
  char: CharInfoWithStill;
  gridMode: boolean;
  hideSpoiler: boolean;
  onReadChange: (id: string) => void;
  onRateChange: (id: string, rate: number) => void;
}> = (props) => {
  const [open, setOpen] = useState(false);
  const { char } = props;
  const { i18n } = useTranslation();

  let charName = i18n.language === "ja" ? char.nameJa : char.nameEn;
  if (props.hideSpoiler) {
    const arr = charName.split(" ");
    arr[arr.length - 1] = "*".repeat(arr[arr.length - 1].length);
    charName = arr.join(" ");
  }
  const allRead =
    char.stills.filter((x) => x.read).length === char.stills.length;
  const countColor =
    char.stills.length === 0 ? "#cd4246" : allRead ? "#fbd065" : "inherit";

  const handleOpenToggle = () => {
    if (!props.gridMode) return;
    setOpen(!open);
  };

  return (
    <StillCard
      open={open}
      gridMode={props.gridMode}
      char={char}
      onReadChange={props.onReadChange}
      onRateChange={props.onRateChange}
      onClose={handleOpenToggle}
    >
      <div
        css={css`
          display: flex;
          flex-direction: column;
          align-items: center;
        `}
        onClick={handleOpenToggle}
      >
        <Tooltip minimal compact content={charName} position="bottom">
          <Button css={card} className={char.owned ? "owned" : ""}>
            <img
              css={css`
                width: 54px;
                height: 54px;
                filter: ${props.hideSpoiler ? "blur(8px)" : "none"};

                @media (max-width: 992px) {
                  /** 100vw - 外のPadding - 画像周りのPadding*6 - flex gap*6 */
                  --max-size: calc((100vw - 30px - 36px - 15px) / 6);
                  width: var(--max-size);
                  max-width: 60px;
                  height: var(--max-size);
                  max-height: 60px;
                }
              `}
              src={getImageUrl("char/" + char.image)}
              alt={charName}
            />
            <img
              css={classIcon}
              src={getImageUrl("class/" + char.class + ".png")}
              alt={displayCharClass(char.class)}
            />
          </Button>
        </Tooltip>
        <div>
          <span
            css={css`
              color: ${countColor};
            `}
          >
            {char.stills.filter((x) => x.read).length} / {char.stills.length}
          </span>
        </div>
      </div>
    </StillCard>
  );
};
const MemoizeCharacterPanel = React.memo(
  CharacterPanel,
  (prevProps, nextProps) => dequal(prevProps, nextProps)
);

type StillCardProps = {
  children: React.ReactNode;
  char: CharInfoWithStill;
  open: boolean;
  gridMode: boolean;
  onReadChange: (id: string) => void;
  onRateChange: (id: string, rate: number) => void;
  onClose: () => void;
};

const StillCard: React.FC<StillCardProps> = (props) => {
  const { customLabels } = useContext(CustomLabelContext);
  const { t } = useTranslation();

  if (props.gridMode && !props.open) return props.children;

  const handleReadChange = (id: string) => {
    props.onReadChange(id);
  };

  return (
    <Card
      css={css`
        width: 100%;
        padding: 15px;
      `}
    >
      <LazyLoad height={130}>
        <div
          css={css`
            display: flex;
            align-items: flex-start;
            gap: 0 15px;
          `}
        >
          <div
            css={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 5px;
              position: sticky;
              top: 10px;
            `}
          >
            <div>{props.children}</div>
            {props.gridMode && (
              <Button onClick={props.onClose} small>
                {t("ui.button.close")}
              </Button>
            )}
          </div>
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              gap: 5px;
            `}
          >
            {props.char.stills.map((x) => (
              <div
                key={x.id}
                css={css`
                  position: relative;
                  display: flex;
                `}
              >
                <img
                  css={css`
                    width: 175px;
                    aspect-ratio: 16 / 9; /** 読み込み中のheightを確保 */
                    opacity: ${x.read ? 1 : 0.7};
                  `}
                  loading="lazy"
                  alt={x.label}
                  src={getImageUrl("still/" + x.image)}
                  onClick={() => handleReadChange(x.id)}
                />
                <Button
                  css={css`
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    margin: auto;
                  `}
                  minimal
                  onClick={() => handleReadChange(x.id)}
                >
                  <Icon
                    size={60}
                    color={x.read ? "#14d13e" : "gray"}
                    icon="tick"
                  />
                </Button>
                <div
                  css={css`
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    opacity: 0.85;
                  `}
                >
                  <UserLabelEmojiSelect
                    value={x.rate.toString()}
                    onChange={(v) => props.onRateChange(x.id, Number(v))}
                    options={[
                      { value: "-1", label: "💭" },
                      { value: "0", label: customLabels[0] },
                      { value: "1", label: customLabels[1] },
                      { value: "2", label: customLabels[2] },
                      { value: "3", label: customLabels[3] },
                      { value: "4", label: customLabels[4] },
                      { value: "5", label: customLabels[5] },
                      { value: "6", label: customLabels[6] },
                    ]}
                  />
                </div>
                <div
                  css={css`
                    position: absolute;
                    top: 0;
                    left: 0;
                    margin-left: 2px;
                    text-shadow: 1px 1px 0 #000, -1px 1px 0 #000,
                      1px -1px 0 #000, -1px -1px 0 #000;
                    text-align: center;
                    font-size: 95%;
                  `}
                >
                  {x.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </LazyLoad>
    </Card>
  );
};

export default CharacterAndStillList;
