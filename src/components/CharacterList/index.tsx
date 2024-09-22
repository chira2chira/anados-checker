import { CharInfo } from "@/pages";
import { displayCharClass } from "@/utils/stringUtil";
import React from "react";
import { Button, Tooltip } from "@blueprintjs/core";
import { css } from "@emotion/react";
import { useTranslation } from "next-i18next";
import { dequal } from "dequal";

const SPOILER_CHARS = [143, 150];

type CharacterListProps = {
  characters: CharInfo[];
  hideSpoiler: boolean;
  onCharClick: (id: number) => void;
};

const CharacterList: React.FC<CharacterListProps> = (props) => {
  return props.characters.map((x) => {
    const useSpoilerFilter = SPOILER_CHARS.includes(x.id) && props.hideSpoiler;

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
  char: CharInfo;
  hideSpoiler: boolean;
  onCharClick: (id: number) => void;
}> = (props) => {
  const { char } = props;
  const { i18n } = useTranslation();

  let charName = i18n.language === "ja" ? char.nameJa : char.nameEn;
  if (props.hideSpoiler) {
    const arr = charName.split(" ");
    arr[arr.length - 1] = "*".repeat(arr[arr.length - 1].length);
    charName = arr.join(" ");
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
          css={{ filter: props.hideSpoiler ? "blur(8px)" : "none" }}
          src={"/static/image/char/" + char.image}
          width="54px"
          height="54px"
          alt={charName}
        />
        <img
          css={classIcon}
          src={"/static/image/class/" + char.class + ".png"}
          alt={displayCharClass(char.class)}
        />
      </Button>
    </Tooltip>
  );
};
const MemoizeCharacterPanel = React.memo(
  CharacterPanel,
  (prevProps, nextProps) => dequal(prevProps, nextProps)
);

export default CharacterList;
