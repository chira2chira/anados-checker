import { GetStaticProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { css } from "@emotion/react";
import { Button, ButtonGroup, Checkbox } from "@blueprintjs/core";
import { forceCheck } from "react-lazyload";
import * as styles from "@/styles/Home.module";
import type { CharClass, CharInfo } from "..";
import {
  CharInfoWithStill,
  loadStillMaster,
  StillInfo,
} from "@/utils/yamlUtil";
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

function getUniqueSills(stills: StillState[]) {
  return Array.from(new Map(stills.map((x) => [x.id, x])).values());
}

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

function filterSillAttributeChar(filter: string) {
  return function (char: CharInfoWithStill) {
    switch (filter) {
      case "none":
        return char.stills.length !== 0;
      case "showStill0":
        return true;
      default:
        return char.stills.length !== 0;
    }
  };
}

function filterSillAttribute(filter: string) {
  return function (still: StillInfo) {
    switch (filter) {
      case "none":
        return true;
      case "ignoreStoryStill":
        return still.label === "Still";
      case "onlyStoryStill":
        return still.label !== "Still";
      default:
        return true;
    }
  };
}

function filterReadStill(filter: string) {
  return function (still: StillState) {
    switch (filter) {
      case "none":
        return true;
      case "unread":
        return !still.read;
      case "read":
        return still.read;
    }
  };
}

function filterRateStill(filter: string) {
  return function (still: StillState) {
    if (filter === "none") return true;
    return still.rate === Number(filter);
  };
}

const StillManager: NextPage<StillManagerProps> = (props) => {
  const [owned, setOwned] = useState<number[]>([]);
  const [stillStates, setStillStates] = useState<StillState[]>([]);
  const [filterClass, setFilterClass] = useState<CharClass[]>([]);
  const [filterOwned, setFilterOwned] = useState("none");
  const [filterLimited, setFilterLimited] = useState("none");
  const [filterStill, setFilterNotImplemented] = useState("none");
  const [filterRead, setFilterRead] = useState("none");
  const [filterRate, setFilterRate] = useState("none");
  const [hideSpoiler, setHideSpoiler] = useState(true);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
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
            stills: x.stills
              .map((y) => {
                const state = stillStates.filter((s) => s.id === y.id);
                if (state.length === 0) return y;
                return {
                  ...y,
                  read: state[0].read,
                  rate: state[0].rate,
                };
              })
              .filter(filterReadStill(filterRead))
              .filter(filterRateStill(filterRate))
              .filter(filterSillAttribute(filterStill)),
          }))
          .filter((x) =>
            filterClass.length === 0 ? true : filterClass.includes(x.class)
          )
          .filter(filterOwnedChar(filterOwned))
          .filter(filterLimitedChar(filterLimited))
          .filter(filterSillAttributeChar(filterStill));
      const rare0 = applyFilter(0);
      const rare1 = applyFilter(1);
      const rare2 = applyFilter(2);
      const rare3 = applyFilter(3);
      const rare4 = applyFilter(4);
      const rare5 = applyFilter(5);
      const rare6 = applyFilter(6);
      const rare7 = applyFilter(7);

      // 次TickでLazyLoadの描画チェックを走らせる
      setTimeout(forceCheck, 0);

      return {
        rare0,
        rare1,
        rare2,
        rare3,
        rare4,
        rare5,
        rare6,
        rare7,
      };
    }, [
      filterClass,
      filterLimited,
      filterStill,
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

  const handleBulkRegister = (stills: StillState[]) => {
    let newStates = stillStates.concat(stills);
    newStates = getUniqueSills(newStates);
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
    <Container
      titleLink="/still/manager"
      title={t2("title")}
      description={t2("description")}
    >
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
              value={filterStill}
              onChange={setFilterNotImplemented}
              options={[
                { value: "none", label: t("ui.filter.stillBy") },
                { value: "showStill0", label: t("ui.filter.showStill0") },
                {
                  value: "ignoreStoryStill",
                  label: t("ui.filter.ignoreStoryStill"),
                },
                {
                  value: "onlyStoryStill",
                  label: t("ui.filter.onlyStoryStill"),
                },
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
            justify-content: flex-end;
            gap: 3px;
            width: 100%;
            margin-bottom: 10px;
          `}
        >
          <Button
            intent={layout === "grid" ? "success" : "none"}
            icon="grid-view"
            outlined
            onClick={() => setLayout("grid")}
          />
          <Button
            intent={layout === "list" ? "success" : "none"}
            icon="list"
            outlined
            onClick={() => setLayout("list")}
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
            gridMode={layout === "grid"}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={6}
            charInfo={rare6}
            gridMode={layout === "grid"}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={5}
            charInfo={rare5}
            gridMode={layout === "grid"}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={4}
            charInfo={rare4}
            gridMode={layout === "grid"}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={3}
            charInfo={rare3}
            gridMode={layout === "grid"}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={2}
            charInfo={rare2}
            gridMode={layout === "grid"}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={1}
            charInfo={rare1}
            gridMode={layout === "grid"}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={0}
            charInfo={rare0}
            gridMode={layout === "grid"}
            hideSpoiler={hideSpoiler}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
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
  gridMode: boolean;
  hideSpoiler: boolean;
  onReadChange: (id: string) => void;
  onRateChange: (id: string, rate: number) => void;
  onBulkRegister: (stills: StillState[]) => void;
};

export const CharacterArea: React.FC<CharacterAreaProps> = (props) => {
  const { t } = useTranslation("common");

  if (props.charInfo.length === 0) return null;

  let allStills = props.charInfo.reduce<StillState[]>(
    (p, c) => p.concat(c.stills),
    []
  );
  allStills = getUniqueSills(allStills);
  const allRead = allStills.filter((x) => x.read).length === allStills.length;

  const handleBulkRegister = () => {
    if (allRead) {
      // すべて既読の場合
      props.onBulkRegister(
        allStills.map((x) => ({ id: x.id, rate: x.rate, read: false }))
      );
    } else {
      // 未読がある場合
      props.onBulkRegister(
        allStills.map((x) => ({ id: x.id, rate: x.rate, read: true }))
      );
    }
  };

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
          <Button
            outlined
            css={css`
              width: 6.3rem;
              font-size: 80%;
            `}
            onClick={handleBulkRegister}
          >
            {allRead ? t("ui.button.uncheckAll") : t("ui.button.checkAll")}
          </Button>
        </div>
      </div>
      <div
        className="char-list"
        css={css`
          display: flex;
          flex-wrap: wrap;
          flex-direction: ${props.gridMode ? "row" : "column"};
          gap: 3px;
        `}
      >
        <CharacterAndStillList
          characters={props.charInfo}
          gridMode={props.gridMode}
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
