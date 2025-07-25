import { GetStaticProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { css } from "@emotion/react";
import { Button, ButtonGroup, ButtonProps, Switch } from "@blueprintjs/core";
import { forceCheck } from "react-lazyload";
import * as styles from "@/styles/Home.module";
import { CharClass, CharInfo, CharInfoWithStill } from "@/types/unit";
import { StillInfo } from "@/types/still";
import { loadStillMaster } from "@/utils/yamlUtil";
import { Container } from "@/components/Container";
import FilterSelect from "@/components/FilterSelect";
import ClassButton from "@/components/ClassButton";
import { sendEvent } from "@/utils/gtag";
import { TopToaster } from "@/utils/toast";
import CharacterAndStillList from "@/components/CharacterAndStillList";
import { StillRouletteModal } from "@/components/StillRouletteModal";
import { HideSpoilerContext } from "@/providers/HideSpoilerProvider";
import useStillState from "@/hooks/useStillState";
import useCharacterOwnership from "@/hooks/useCharacterOwnership";
import { CustomLabelModal } from "@/components/CustomLabelModal";
import { CustomLabelContext } from "@/providers/CustomLabelProvider";
import { StillState } from "@/types/still";
import { getImageUrl } from "@/utils/image";

type StillManagerProps = {
  charInfoWithStills: CharInfoWithStill[];
};

type StillType = "intimacy" | "secret" | "story" | "eidos";

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

function filterSillAttribute(filter: StillType[]) {
  return function (still: StillInfo) {
    if (filter.length === 0) return true;
    let result = false;
    for (const type of filter) {
      if (type === "intimacy") {
        if (still.label === "Still") {
          result = true;
        }
      } else if (type === "secret") {
        if (still.label === "Secret") {
          result = true;
        }
      } else if (type === "eidos") {
        if (still.label === "Eidos") {
          result = true;
        }
      } else if (type === "story") {
        if (!["Still", "Secret", "Eidos"].includes(still.label)) {
          result = true;
        }
      }
    }
    return result;
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
  const { owned } = useCharacterOwnership();
  const { stillStates, setStillStates, save } = useStillState();
  const [stillInitialized, setStillInitialized] = useState(false);
  const [filterClass, setFilterClass] = useState<CharClass[]>([]);
  const [filterStillType, setFilterStillType] = useState<StillType[]>([]);
  const [filterOwned, setFilterOwned] = useState("none");
  const [filterLimited, setFilterLimited] = useState("none");
  const [filterStill, setFilterNotImplemented] = useState("none");
  const [filterRead, setFilterRead] = useState("none");
  const [filterRate, setFilterRate] = useState("none");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const { hideSpoiler, setHideSpoiler } = useContext(HideSpoilerContext);
  const { customLabels } = useContext(CustomLabelContext);
  const { t } = useTranslation("common");
  const { t: t2 } = useTranslation("still");

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
              .filter(filterSillAttribute(filterStillType)),
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
      props.charInfoWithStills,
      filterOwned,
      filterLimited,
      filterStill,
      owned,
      filterRead,
      filterRate,
      filterStillType,
      stillStates,
      filterClass,
    ]);

  useEffect(() => {
    if (stillInitialized || stillStates.length === 0) return;

    // スチルの初期化処理
    const newStillStates = stillStates.map((x) => {
      // 共有スチルが固有スチルに変更された場合のマイグレーション
      if (
        !props.charInfoWithStills.some((y) =>
          y.stills.some((z) => z.id === x.id)
        )
      ) {
        const char = props.charInfoWithStills.find(
          (y) => y.unitId === Number(x.id.split(":")[0])
        );
        const newChar = props.charInfoWithStills.find(
          (y) =>
            y.id ===
            char?.stills[0]?.groupIds[(Number(x.id.split(":")[1]) - 1) / 2]
        );
        const still = newChar?.stills.find((y) => y.label === "Still");
        // 既に固有スチルが登録されている場合はスキップ
        if (still && !stillStates.some((y) => y.id === still.id)) {
          return { ...x, id: still.id };
        }
      }
      return x;
    });
    setStillStates(newStillStates);
    setStillInitialized(true);
  }, [props.charInfoWithStills, setStillStates, stillInitialized, stillStates]);

  const handleReadChange = useCallback(
    (id: string) => {
      setStillStates((x) => {
        const oldStateTmp = x.filter((y) => y.id === id);
        const oldState: StillState =
          oldStateTmp.length === 0
            ? { id, read: false, rate: -1 }
            : oldStateTmp[0];
        const newStates = x.filter((y) => y.id !== id);
        newStates.push({ ...oldState, read: !oldState.read });
        return newStates;
      });
    },
    [setStillStates]
  );

  const handleRateChange = useCallback(
    (id: string, rate: number) => {
      setStillStates((x) => {
        const oldStateTmp = x.filter((y) => y.id === id);
        const oldState: StillState =
          oldStateTmp.length === 0
            ? { id, read: false, rate: -1 }
            : oldStateTmp[0];
        const newStates = x.filter((y) => y.id !== id);
        newStates.push({ ...oldState, rate });
        return newStates;
      });
    },
    [setStillStates]
  );

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

  const changeFilterStill = (type: StillType) => {
    if (filterStillType.includes(type)) {
      setFilterStillType((x) => x.filter((y) => y !== type));
    } else {
      setFilterStillType((x) => [...x, type]);
    }
  };

  const handleSave = () => {
    save();
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
            justify-content: stretch;
            gap: 8px;
          `}
        >
          <ButtonGroup fill>
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

          <ButtonGroup fill>
            <StillTypeButton
              intent={filterStillType.includes("intimacy") ? "primary" : "none"}
              stillType="intimacy"
              onStillTypeClick={changeFilterStill}
            >
              {t2("button.intimacyStill")}
            </StillTypeButton>
            <StillTypeButton
              intent={filterStillType.includes("secret") ? "primary" : "none"}
              stillType="secret"
              onStillTypeClick={changeFilterStill}
            >
              {t2("button.secretStill")}
            </StillTypeButton>
            <StillTypeButton
              intent={filterStillType.includes("eidos") ? "primary" : "none"}
              stillType="eidos"
              onStillTypeClick={changeFilterStill}
            >
              {t2("button.eidosStill")}
            </StillTypeButton>
            <StillTypeButton
              intent={filterStillType.includes("story") ? "primary" : "none"}
              stillType="story"
              onStillTypeClick={changeFilterStill}
            >
              {t2("button.storyStill")}
            </StillTypeButton>
          </ButtonGroup>

          <div
            css={css`
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
              ]}
            />

            <FilterSelect
              value={filterRate}
              onChange={setFilterRate}
              options={[
                { value: "none", label: t("ui.filter.userLabelBy") },
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
              display: flex;
              justify-content: space-between;
              align-items: center;
            `}
          >
            <Switch
              style={{ marginBottom: "0" }}
              checked={hideSpoiler}
              label={t("ui.button.spoilerFilter")}
              onChange={() => {
                setHideSpoiler(!hideSpoiler);
              }}
            />
            <Button
              minimal
              onClick={() => setLabelModalOpen(true)}
              icon="settings"
            >
              {t2("button.labelSettings")}
            </Button>
          </div>
        </div>

        <div
          css={css`
            display: flex;
            justify-content: space-between;
            width: 100%;
            margin-bottom: 20px;
          `}
        >
          <Button onClick={() => setRouletteOpen(true)} outlined>
            {t2("button.stillRoulette")}
          </Button>
          <div
            css={css`
              display: flex;
              gap: 3px;
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
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={6}
            charInfo={rare6}
            gridMode={layout === "grid"}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={5}
            charInfo={rare5}
            gridMode={layout === "grid"}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={4}
            charInfo={rare4}
            gridMode={layout === "grid"}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={3}
            charInfo={rare3}
            gridMode={layout === "grid"}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={2}
            charInfo={rare2}
            gridMode={layout === "grid"}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={1}
            charInfo={rare1}
            gridMode={layout === "grid"}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={0}
            charInfo={rare0}
            gridMode={layout === "grid"}
            onReadChange={handleReadChange}
            onRateChange={handleRateChange}
            onBulkRegister={handleBulkRegister}
          />
        </div>
      </div>
      <div
        css={css`
          position: fixed;
          top: 10px;
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

      <StillRouletteModal
        isOpen={rouletteOpen}
        charInfoArr={[rare0, rare1, rare2, rare3, rare4, rare5, rare6, rare7]}
        onClose={() => setRouletteOpen(false)}
      />
      <CustomLabelModal
        isOpen={labelModalOpen}
        onClose={() => setLabelModalOpen(false)}
      />
    </Container>
  );
};

type StillTypeButtonProps = {
  stillType: StillType;
  onStillTypeClick: (type: StillType) => void;
} & ButtonProps;

const StillTypeButton: React.FC<StillTypeButtonProps> = (props) => {
  const { stillType, onStillTypeClick, ...buttonProps } = props;

  const handleStillTypeClick = () => {
    props.onStillTypeClick(stillType);
  };

  return (
    <Button {...buttonProps} onClick={handleStillTypeClick}>
      {props.children}
    </Button>
  );
};

type CharacterAreaProps = {
  rarity: number;
  charInfo: CharInfoWithStill[];
  gridMode: boolean;
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
                  src={getImageUrl("common/star.png")}
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
