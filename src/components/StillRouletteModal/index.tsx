import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogBody } from "@blueprintjs/core";
import { css, keyframes } from "@emotion/react";
import { CharInfoWithStill, StillInfo } from "@/utils/yamlUtil";
import { sendEvent } from "@/utils/gtag";

const SPOILER_CHARS = [143, 150];

type StillRouletteModal = {
  isOpen: boolean;
  charInfoArr: CharInfoWithStill[][];
  hideSpoiler: boolean;
  onClose: () => void;
};

type RouletteState = "pause" | "running" | "finish";

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const growAni = keyframes`
  0% {
    background-position: 0%;
  }
  100% {
    background-position: 400%;
  }
`;

const grow = css`
  display: inline-block;
  text-decoration: none;
  color: white;
  background-image: linear-gradient(to right, #64b3f4, #c2e59c, #64b3f4);
  background-size: 400%;
  position: relative;
  z-index: 2;
  animation: ${growAni} 6s linear infinite;

  &:before {
    content: "";
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    background: inherit;
    filter: blur(1em);
    animation: ${growAni} 6s linear infinite;
  }
`;

export const StillRouletteModal: React.FC<StillRouletteModal> = (props) => {
  const [stillIndex, setStillIndex] = useState(0);
  const [state, setState] = useState<RouletteState>("pause");
  const [targetStills, setTargetStills] = useState<StillInfo[]>([]);
  const intervalRef = useRef(0);
  const { t } = useTranslation("still");

  const charInfo = props.charInfoArr.flat();
  let allStills = charInfo.reduce<StillInfo[]>(
    (p, c) => p.concat(c.stills),
    []
  );
  allStills = Array.from(new Map(allStills.map((x) => [x.id, x])).values());
  const displayStill = targetStills[stillIndex];
  const displayChars = charInfo.filter((x) =>
    x.stills.map((y) => y.id).includes(displayStill?.id)
  );

  const reset = () => {
    setStillIndex(0);
    setState("pause");
  };

  const start = () => {
    let targetStills: StillInfo[];
    if (allStills.length > 20) {
      // 画像読み込みを減らすため予め抽選する
      const shuffledStills = shuffle(allStills);
      targetStills = shuffledStills.slice(0, 20);
    } else {
      targetStills = allStills;
    }
    // プリロード（低速回線向け）
    for (const still of targetStills) {
      const img = document.createElement("img");
      img.src = "/static/image/still/" + still.image;
    }

    setTargetStills(targetStills);
    setState("running");

    sendEvent({
      action: "start",
      category: "roulette",
      label: "still",
    });
  };

  const next = useCallback(() => {
    setStillIndex((index) => {
      const nextIndex = index + 1;
      return nextIndex < targetStills.length ? nextIndex : 0;
    });
  }, [targetStills.length]);

  const stop = () => {
    clearInterval(intervalRef.current);
    setState("finish");
  };

  useEffect(() => {
    if (state === "running") {
      intervalRef.current = window.setInterval(next, 50);
    }
  }, [next, state]);

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      onClosing={reset}
      title={t("button.stillRoulette")}
    >
      <DialogBody>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
            margin-bottom: 10px;
          `}
        >
          <div
            css={css`
              font-size: 150%;
            `}
          >
            {t("text.todayStillIs")}
          </div>
          <div css={state === "finish" && grow}>
            {state === "pause" ? (
              <div
                css={css`
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  gap: 15px;
                  width: 288px;
                  height: 162px;
                `}
              >
                <Button
                  intent="primary"
                  large
                  disabled={allStills.length === 0}
                  onClick={start}
                >
                  {t("button.start")}
                </Button>
                <div
                  css={css`
                    display: flex;
                    flex-direction: column;
                    padding: 8px 15px;
                    border-radius: 2px;
                    background-color: #1c2127;
                    font-size: 95%;
                  `}
                >
                  <span>
                    {t("text.stillCount")}：{allStills.length}
                  </span>
                  <span>{t("text.appliledFilter")}</span>
                </div>
              </div>
            ) : (
              <>
                <img
                  css={css`
                    vertical-align: bottom;
                  `}
                  src={"/static/image/still/" + displayStill.image}
                  alt={displayStill.label}
                  onClick={stop}
                />
                {state === "finish" && (
                  <div
                    css={css`
                      position: absolute;
                      top: 0;
                      left: 0;
                      margin-left: 2px;
                      text-shadow: 1px 1px 0 #000, -1px 1px 0 #000,
                        1px -1px 0 #000, -1px -1px 0 #000;
                      text-align: center;
                      font-size: 110%;
                    `}
                  >
                    {displayStill.label}
                  </div>
                )}
              </>
            )}
          </div>
          {state === "running" && (
            <Button intent="primary" large onClick={stop}>
              Stop
            </Button>
          )}
          {state === "finish" && (
            <>
              <div
                css={css`
                  display: flex;
                  flex-wrap: wrap;
                  justify-content: center;
                  gap: 10px 30px;
                `}
              >
                {displayChars
                  .sort((a, b) => (a.id < b.id ? -1 : 1))
                  .map((x) => (
                    <CharCard
                      key={x.id}
                      char={x}
                      hideSpoiler={
                        SPOILER_CHARS.includes(x.id) && props.hideSpoiler
                      }
                    />
                  ))}
              </div>
              <Button intent="primary" large outlined onClick={start}>
                {t("button.restart")}
              </Button>
            </>
          )}
        </div>
      </DialogBody>
    </Dialog>
  );
};

type CharCardProps = {
  char: CharInfoWithStill;
  hideSpoiler: boolean;
};
const CharCard: React.FC<CharCardProps> = (props) => {
  const { char } = props;
  const { i18n } = useTranslation();

  let charName = i18n.language === "ja" ? char.nameJa : char.nameEn;
  if (props.hideSpoiler) {
    const arr = charName.split(" ");
    arr[arr.length - 1] = "*".repeat(arr[arr.length - 1].length);
    charName = arr.join(" ");
  }

  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        gap: 15px;
        font-size: 120%;
      `}
    >
      <img
        css={css`
          width: 50px;
          border-radius: 25px;
          filter: ${props.hideSpoiler ? "blur(8px)" : "none"};
        `}
        src={"/static/image/char/" + char.image}
        alt={charName}
      />
      <span>{charName}</span>
    </div>
  );
};
