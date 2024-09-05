import { GetStaticProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { css } from "@emotion/react";
import { Button, ButtonGroup, Checkbox } from "@blueprintjs/core";
import * as styles from "@/styles/Home.module";
import { CharClass, CharInfo } from "..";
import { CharInfoWithStill, loadStillMaster } from "@/utils/yamlUtil";
import { Container } from "@/components/Container";
import FilterSelect from "@/components/FilterSelect";
import ClassButton from "@/components/ClassButton";
import { sendEvent } from "@/utils/gtag";
import { TopToaster } from "@/utils/toast";
import { useEffect, useMemo, useState } from "react";
import {
  parseLocalStorageChar,
  parseLocalStorageStill,
} from "@/utils/charUtil";
import { getRateEmoji } from "@/utils/rateEnum";
import CharacterAndStillList from "@/components/CharacterAndStillList";

const CHAR_KEY = "chars";
const STILL_KEY = "still";
const SPOILER_KEY = "hidespoiler";

type StillManagerProps = {
  charInfoWithStills: CharInfoWithStill[];
};

type StillState = {
  id: string;
  read: boolean;
  rate: number;
};

function filterOwnedChar(filter: string) {
  return function (char: CharInfo) {
    switch (filter) {
      case "none":
        return true;
      case "notOwned":
        return !char.owned;
      case "owned":
        return char.owned;
    }
  };
}

function filterLimitedChar(filter: string) {
  return function (char: CharInfo) {
    switch (filter) {
      case "none":
        return true;
      case "standard":
        return !char.limited;
      case "limited":
        return char.limited;
    }
  };
}

function filterNotImplementedChar(filter: string) {
  return function (char: CharInfoWithStill) {
    if (filter === "show") {
      return char;
    } else {
      return char.stills.length !== 0;
    }
  };
}

function filterReadChar(filter: string) {
  return function (char: CharInfoWithStill) {
    switch (filter) {
      case "none":
        return true;
      case "unread":
        if (char.stills.length === 0) return false;
        return char.stills.filter((x) => x.read).length !== char.stills.length;
      case "read":
        if (char.stills.length === 0) return false;
        return char.stills.filter((x) => x.read).length === char.stills.length;
    }
  };
}

function filterRateChar(filter: string) {
  return function (char: CharInfoWithStill) {
    if (filter === "none") return true;
    return char.stills.filter((x) => x.rate === Number(filter)).length > 0;
  };
}

const StillManager: NextPage<StillManagerProps> = (props) => {
  const [owned, setOwned] = useState<number[]>([]);
  const [stillStates, setStillStates] = useState<StillState[]>([]);
  const [filterClass, setFilterClass] = useState<CharClass[]>([]);
  const [filterOwned, setFilterOwned] = useState("none");
  const [filterLimited, setFilterLimited] = useState("none");
  const [filterNotImplemented, setFilterNotImplemented] = useState("none");
  const [filterRead, setFilterRead] = useState("none");
  const [filterRate, setFilterRate] = useState("none");
  const [hideSpoiler, setHideSpoiler] = useState(true);
  const { t } = useTranslation("common");
  const { t: t2 } = useTranslation("still");

  useEffect(() => {
    // SSRを避けて取得する
    const storedCharValue = window.localStorage.getItem(CHAR_KEY);
    const storedStillValue = window.localStorage.getItem(STILL_KEY);
    if (storedCharValue) {
      setOwned(parseLocalStorageChar(storedCharValue));
    }
    if (storedStillValue) {
      setStillStates(parseLocalStorageStill(storedStillValue));
    }
    setHideSpoiler(
      window.localStorage.getItem(SPOILER_KEY) === "false" ? false : true
    );
  }, []);

  const { rare0, rare1, rare2, rare3, rare4, rare5, rare6, rare7 } =
    useMemo(() => {
      const applyFilter = (rarity: number) =>
        props.charInfoWithStills
          .filter((x) => x.rarity === rarity)
          .map((x) => ({
            ...x,
            owned: owned.includes(x.id),
            stills: x.stills.map((y) => {
              const state = stillStates.filter((s) => s.id === y.id);
              if (state.length === 0) return y;
              return {
                ...y,
                read: state[0].read,
                rate: state[0].rate,
              };
            }),
          }))
          .filter((x) =>
            filterClass.length === 0 ? true : filterClass.includes(x.class)
          )
          .filter(filterOwnedChar(filterOwned))
          .filter(filterLimitedChar(filterLimited))
          .filter(filterNotImplementedChar(filterNotImplemented))
          .filter(filterReadChar(filterRead))
          .filter(filterRateChar(filterRate));
      const rare0 = applyFilter(0);
      const rare1 = applyFilter(1);
      const rare2 = applyFilter(2);
      const rare3 = applyFilter(3);
      const rare4 = applyFilter(4);
      const rare5 = applyFilter(5);
      const rare6 = applyFilter(6);
      const rare7 = applyFilter(7);
      return { rare0, rare1, rare2, rare3, rare4, rare5, rare6, rare7 };
    }, [
      filterClass,
      filterLimited,
      filterNotImplemented,
      filterOwned,
      filterRate,
      filterRead,
      owned,
      props.charInfoWithStills,
      stillStates,
    ]);

  const handleReadChange = (id: string) => {
    const oldStateTmp = stillStates.filter((x) => x.id === id);
    const oldState: StillState =
      oldStateTmp.length === 0 ? { id, read: false, rate: -1 } : oldStateTmp[0];
    const newStates = stillStates.filter((x) => x.id !== id);
    newStates.push({ ...oldState, read: !oldState.read });
    setStillStates(newStates);
  };

  const handleRateChange = (id: string, rate: number) => {
    const oldStateTmp = stillStates.filter((x) => x.id === id);
    const oldState: StillState =
      oldStateTmp.length === 0 ? { id, read: false, rate: -1 } : oldStateTmp[0];
    const newStates = stillStates.filter((x) => x.id !== id);
    newStates.push({ ...oldState, rate });
    setStillStates(newStates);
  };

  const changeFilterClass = (charClass: CharClass) => {
    if (filterClass.includes(charClass)) {
      setFilterClass((x) => x.filter((y) => y !== charClass));
    } else {
      setFilterClass((x) => [...x, charClass]);
    }
  };

  const handleSave = () => {
    window.localStorage.setItem(STILL_KEY, JSON.stringify(stillStates));
    TopToaster?.show({
      intent: "success",
      message: t("ui.message.saved"),
    });
    sendEvent({
      action: "save",
      category: "still",
      label: "success",
    });
  };

  return (
    <Container titleLink="/still/manager" title={t2("title")}>
      <div css={styles.main}>
        <div
          css={css`
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          `}
        >
          <ButtonGroup>
            <ClassButton
              intent={filterClass.includes("vanguard") ? "primary" : "none"}
              charClass="vanguard"
              onClassClick={changeFilterClass}
            />
            <ClassButton
              intent={filterClass.includes("fighter") ? "primary" : "none"}
              charClass="fighter"
              onClassClick={changeFilterClass}
            />
            <ClassButton
              intent={filterClass.includes("guard") ? "primary" : "none"}
              charClass="guard"
              onClassClick={changeFilterClass}
            />
            <ClassButton
              intent={filterClass.includes("shooter") ? "primary" : "none"}
              charClass="shooter"
              onClassClick={changeFilterClass}
            />
            <ClassButton
              intent={filterClass.includes("caster") ? "primary" : "none"}
              charClass="caster"
              onClassClick={changeFilterClass}
            />
            <ClassButton
              intent={filterClass.includes("healer") ? "primary" : "none"}
              charClass="healer"
              onClassClick={changeFilterClass}
            />
            <ClassButton
              intent={filterClass.includes("support") ? "primary" : "none"}
              charClass="support"
              onClassClick={changeFilterClass}
            />
            <ClassButton
              intent={filterClass.includes("stranger") ? "primary" : "none"}
              charClass="stranger"
              onClassClick={changeFilterClass}
            />
          </ButtonGroup>

          <div
            css={css`
              width: 100%;
              display: flex;
              gap: 5px;
            `}
          >
            <FilterSelect
              value={filterOwned}
              onChange={setFilterOwned}
              options={[
                { value: "none", label: t("ui.filter.ownedBy") },
                { value: "notOwned", label: t("ui.filter.notOwned") },
                { value: "owned", label: t("ui.filter.owned") },
              ]}
            />

            <FilterSelect
              value={filterLimited}
              onChange={setFilterLimited}
              options={[
                { value: "none", label: t("ui.filter.availabilityBy") },
                { value: "standard", label: t("ui.filter.standard") },
                { value: "limited", label: t("ui.filter.limited") },
              ]}
            />

            <FilterSelect
              value={filterRead}
              onChange={setFilterRead}
              options={[
                { value: "none", label: t("ui.filter.readBy") },
                { value: "unread", label: t("ui.filter.unread") },
                { value: "read", label: t("ui.filter.read") },
              ]}
            />
          </div>
          <div
            css={css`
              width: 100%;
              display: flex;
              gap: 5px;
            `}
          >
            <FilterSelect
              value={filterNotImplemented}
              onChange={setFilterNotImplemented}
              options={[
                { value: "none", label: t("ui.filter.notImplementedBy") },
                { value: "show", label: t("ui.filter.showNotImplemented") },
              ]}
            />

            <FilterSelect
              value={filterRate}
              onChange={setFilterRate}
              options={[
                { value: "none", label: t("ui.filter.rateBy") },
                { value: "0", label: getRateEmoji(0) },
                { value: "1", label: getRateEmoji(1) },
                { value: "2", label: getRateEmoji(2) },
                { value: "3", label: getRateEmoji(3) },
                { value: "4", label: getRateEmoji(4) },
                { value: "5", label: getRateEmoji(5) },
                { value: "6", label: getRateEmoji(6) },
              ]}
            />
          </div>

          <Checkbox
            checked={hideSpoiler}
            label={t("ui.button.spoilerFilter")}
            onClick={() => {
              window.localStorage.setItem(SPOILER_KEY, !hideSpoiler + "");
              setHideSpoiler(!hideSpoiler);
            }}
          />
        </div>

        <div
          css={css`
            display: flex;
            flex-direction: column;
            align-items: center;
          `}
        >
          <CharacterArea
            rarity={7}
            charInfo={rare7}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
          />
          <CharacterArea
            rarity={6}
            charInfo={rare6}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
          />
          <CharacterArea
            rarity={5}
            charInfo={rare5}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
          />
          <CharacterArea
            rarity={4}
            charInfo={rare4}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
          />
          <CharacterArea
            rarity={3}
            charInfo={rare3}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
          />
          <CharacterArea
            rarity={2}
            charInfo={rare2}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
          />
          <CharacterArea
            rarity={1}
            charInfo={rare1}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
          />
          <CharacterArea
            rarity={0}
            charInfo={rare0}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
          />
        </div>
      </div>
      <div
        css={css`
          position: fixed;
          top: 23px;
          right: 10px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        `}
      >
        <div
          css={css`
            display: flex;
            gap: 5px;
          `}
        >
          <Button onClick={handleSave} intent="primary">
            {t("ui.button.save")}
          </Button>
          <div></div>
        </div>
      </div>
    </Container>
  );
};

type CharacterAreaProps = {
  rarity: number;
  charInfo: CharInfoWithStill[];
  hideSpoiler: boolean;
  onReadChange: (id: string) => void;
  onRateChange: (id: string, rate: number) => void;
};

export const CharacterArea: React.FC<CharacterAreaProps> = (props) => {
  if (props.charInfo.length === 0) return null;

  let allStills = props.charInfo.reduce<StillState[]>(
    (p, c) => p.concat(c.stills),
    []
  );
  allStills = Array.from(new Map(allStills.map((x) => [x.id, x])).values()); // 重複除去

  return (
    <div
      css={css`
        width: 100%;
        margin-bottom: 20px;
      `}
    >
      <div
        css={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
        `}
      >
        <div>
          {props.rarity === 0
            ? "☆"
            : [...Array(props.rarity)].map((_, i) => (
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
            margin-bottom: 3px;
            display: flex;
            gap: 5px;
            align-items: center;
          `}
        >
          <span
            css={css`
              color: #d3d8de;
              font-size: 70%;
            `}
          >
            {allStills.filter((x) => x.read).length} / {allStills.length}
          </span>
        </div>
      </div>
      <div
        className="char-list"
        css={css`
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
        `}
      >
        <CharacterAndStillList
          characters={props.charInfo}
          hideSpoiler={props.hideSpoiler}
          onReadChange={props.onReadChange}
          onRateChange={props.onRateChange}
        />
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps<StillManagerProps> = async (
  context
) => {
  const { charInfoWithStills } = loadStillMaster();

  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common", "still"])),
      charInfoWithStills,
    },
  };
};

export default StillManager;
