import { UnknownInfo } from "@/types/unit";
import { displayCharClass } from "@/utils/stringUtil";
import React, { useContext } from "react";
import { Button, Tooltip } from "@blueprintjs/core";
import { css } from "@emotion/react";
import { useTranslation } from "next-i18next";
import { dequal } from "dequal";
import { isCharInfo, isEidosInfo } from "@/utils/types";
import { getImageUrl } from "@/utils/image";
import { HideSpoilerContext } from "@/providers/HideSpoilerProvider";

const SPOILER_CHARS = [143, 150];

type CharacterListProps = {
  characters: UnknownInfo[];
  onCharClick: (id: number) => void;
};

const CharacterList: React.FC<CharacterListProps> = (props) => {
  const { hideSpoiler } = useContext(HideSpoilerContext);

  return props.characters.map((x) => {
    const useSpoilerFilter = SPOILER_CHARS.includes(x.id) && hideSpoiler;

    return (
      <MemoizeCharacterPanel
        key={x.id}
        char={x}
        hideSpoiler={useSpoilerFilter}
        onCharClick={props.onCharClick}
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
  char: UnknownInfo;
  hideSpoiler: boolean;
  onCharClick: (id: number) => void;
}> = (props) => {
  const { char } = props;
  const { i18n } = useTranslation();
  const isJa = i18n.language === "ja";
  const basePath =
    isCharInfo(char) ? "char/" : "eidos/";

  let charName = isJa ? char.nameJa : char.nameEn;
  if (props.hideSpoiler) {
    const arr = charName.split(" ");
    arr[arr.length - 1] = "*".repeat(arr[arr.length - 1].length);
    charName = arr.join(" ");
  }
  if (isEidosInfo(char)) {
    charName += isJa ? `（${char.unitNameJa}）` : ` (${char.unitNameEn})`;
  }

  const hancleOnClick = () => {
    props.onCharClick(char.id);
  };

  return (
    <Tooltip minimal compact content={charName} position="bottom">
      <Button
        css={card}
        className={char.owned ? "owned" : ""}
        onClick={hancleOnClick}
      >
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

              .image-preview & {
                width: 54px;
                height: 54px;
              }
            }
          `}
          src={getImageUrl(basePath + char.image)}
          alt={charName}
        />
        {isCharInfo(char) && (
          <img
            css={classIcon}
            src={getImageUrl("class/" + char.class + ".png")}
            alt={displayCharClass(char.class)}
          />
        )}
      </Button>
    </Tooltip>
  );
};
const MemoizeCharacterPanel = React.memo(
  CharacterPanel,
  (prevProps, nextProps) => dequal(prevProps, nextProps)
);

export default CharacterList;
