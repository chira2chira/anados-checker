import * as styles from "@/styles/Home.module";
import { GetStaticProps, NextPage } from "next";
import { loadCharactors } from "@/utils/yamlUtil";
import CharacterList from "@/components/CharacterList";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { css } from "@emotion/react";
import {
  Button,
  ButtonGroup,
  Checkbox,
  InputGroup,
  Tooltip,
} from "@blueprintjs/core";
import ClassButton from "@/components/ClassButton";
import FilterSelect from "@/components/FilterSelect";
import dayjs from "dayjs";
import { TopToaster } from "@/utils/toast";
import { TEMP_CHAR_KEY } from "./share/char/[id]";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { sendEvent } from "@/utils/gtag";
import { parseLocalStorageChar } from "@/utils/charUtil";
import { isIos } from "@/utils/browser";
import { useScroll } from "@/hooks/useScroll";
import { Container } from "@/components/Container";
import { CaptureModal } from "@/components/CaptureModal";

const CHAR_KEY = "chars";
const SPOILER_KEY = "hidespoiler";

export type CharClass =
  | "vanguard"
  | "fighter"
  | "guard"
  | "shooter"
  | "caster"
  | "healer"
  | "support"
  | "stranger";

export type CharInfo = {
  id: number;
  unitId: number;
  nameJa: string;
  nameEn: string;
  rarity: number;
  class: CharClass;
  deployment: string;
  limited: boolean;
  release: string;
  image: string;
  owned: boolean;
};

type HomeProps = {
  charInfo: CharInfo[];
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

function filterDeploymentChar(filter: string) {
  return function (char: CharInfo) {
    switch (filter) {
      case "none":
        return true;
      case "low":
        return char.deployment === "low" || char.deployment === "both";
      case "high":
        return char.deployment === "high" || char.deployment === "both";
      case "both":
        return char.deployment === "both";
    }
  };
}

function filterReleaseChar(filter: string) {
  return function (char: CharInfo) {
    switch (filter) {
      case "none":
        return true;
      case "2021":
        return dayjs(char.release).year() === 2021;
      case "2022":
        return dayjs(char.release).year() === 2022;
      case "2023":
        return dayjs(char.release).year() === 2023;
      case "2024":
        return dayjs(char.release).year() === 2024;
    }
  };
}
const INELIGIBLE_CHAR = ["Gaia", "Barboros", "New Look Barboros"];
function filterTicketChar(filter: string) {
  return function (char: CharInfo) {
    switch (filter) {
      case "none":
        return true;
      case "aniv0.5":
        // https://anothereidos-r.info/news/pnote201/
        if (INELIGIBLE_CHAR.includes(char.nameEn)) return false;
        return (
          char.rarity >= 4 && dayjs(char.release).isBefore(dayjs("2022/6/24"))
        );
      case "aniv1.0":
        // https://anothereidos-r.info/news/pnote1209/
        if (INELIGIBLE_CHAR.includes(char.nameEn)) return false;
        return (
          char.rarity >= 4 &&
          (char.limited
            ? dayjs(char.release).isBefore(dayjs("2022/6/25"))
            : dayjs(char.release).isBefore(dayjs("2022/9/30")))
        );
      case "aniv1.5":
        // https://anothereidos-r.info/news/1-5anniv2023/
        if (INELIGIBLE_CHAR.includes(char.nameEn)) return false;
        return (
          char.rarity >= 4 &&
          (char.limited
            ? dayjs(char.release).isBefore(dayjs("2022/12/24"))
            : dayjs(char.release).isBefore(dayjs("2023/6/23")))
        );
      case "aniv2.0":
        // https://anothereidos-r.info/news/casino_01/
        if (INELIGIBLE_CHAR.includes(char.nameEn)) return false;
        return (
          char.rarity >= 4 &&
          (char.limited
            ? dayjs(char.release).isBefore(dayjs("2023/6/25"))
            : dayjs(char.release).isBefore(dayjs("2023/12/23")))
        );
      case "aniv2.5":
        // https://anothereidos-r.info/news/2-5anniv2024/
        if (INELIGIBLE_CHAR.includes(char.nameEn)) return false;
        return (
          char.rarity >= 4 &&
          (char.limited
            ? dayjs(char.release).isBefore(dayjs("2023/12/23"))
            : dayjs(char.release).isBefore(dayjs("2024/6/22")))
        );
      case "aniv3.0":
        // https://anothereidos-r.info/news/winterdate/
        if (INELIGIBLE_CHAR.includes(char.nameEn)) return false;
        return (
          char.rarity >= 4 &&
          (char.limited
            ? dayjs(char.release).isBefore(dayjs("2024/6/29"))
            : dayjs(char.release).isBefore(dayjs("2024/11/16")))
        );
    }
  };
}

const Home: NextPage<HomeProps> = (props) => {
  const [owned, setOwned] = useState<number[]>([]);
  const [filterClass, setFilterClass] = useState<CharClass[]>([]);
  const [filterOwned, setFilterOwned] = useState("none");
  const [filterLimited, setFilterLimited] = useState("none");
  const [filterDeployment, setFilterDeployment] = useState("none");
  const [filterRelease, setFilterRelease] = useState("none");
  const [filterTicket, setFilterTicket] = useState("none");
  const [hideSpoiler, setHideSpoiler] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [flash, setFlash] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [openCaptureModal, setOpenCaptureModal] = useState(false);
  const shareUrlElm = useRef<HTMLInputElement>(null);
  const { asPath, locale, push } = useRouter();
  const scrolling = useScroll();
  const { t } = useTranslation("common");

  useEffect(() => {
    // SSRを避けて取得する
    if (asPath.startsWith("/share/char/")) {
      const tempStoredValue = window.localStorage.getItem(TEMP_CHAR_KEY);
      if (tempStoredValue) setOwned(parseLocalStorageChar(tempStoredValue));
    } else {
      const storedValue = window.localStorage.getItem(CHAR_KEY);
      if (storedValue) {
        setOwned(parseLocalStorageChar(storedValue));
      } else {
        // 共有ページから戻った際、確実に初期化する
        setOwned([]);
      }
    }
    setHideSpoiler(
      window.localStorage.getItem(SPOILER_KEY) === "false" ? false : true
    );
  }, [asPath]);

  useEffect(() => {
    setFlash(true);

    setTimeout(() => {
      setFlash(false);
    }, 0);
  }, [asPath]);

  const { rare0, rare1, rare2, rare3, rare4, rare5, rare6, rare7 } =
    useMemo(() => {
      const applyFilter = (rarity: number) =>
        props.charInfo
          .filter((x) => x.rarity === rarity)
          .map((x) => ({ ...x, owned: owned.includes(x.id) }))
          .filter((x) =>
            filterClass.length === 0 ? true : filterClass.includes(x.class)
          )
          .filter(filterOwnedChar(filterOwned))
          .filter(filterLimitedChar(filterLimited))
          .filter(filterDeploymentChar(filterDeployment))
          .filter(filterReleaseChar(filterRelease))
          .filter(filterTicketChar(filterTicket));
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
      props.charInfo,
      filterOwned,
      filterLimited,
      filterDeployment,
      filterRelease,
      filterTicket,
      filterClass,
      owned,
    ]);

  const handleCharClick = useCallback(
    (id: number) => {
      setOwned((x) => {
        if (x.includes(id)) {
          return x.filter((y) => y !== id);
        } else {
          return [...x, id];
        }
      });
    },
    []
  );

  const handleBulkRegister = (ids: number[]) => {
    ids.forEach((x) => handleCharClick(x));
  };

  const changeFilterClass = (charClass: CharClass) => {
    if (filterClass.includes(charClass)) {
      setFilterClass((x) => x.filter((y) => y !== charClass));
    } else {
      setFilterClass((x) => [...x, charClass]);
    }
  };

  const handleSave = () => {
    window.localStorage.setItem(CHAR_KEY, owned.join(","));
    TopToaster?.show({
      intent: "success",
      message: t("ui.message.saved"),
    });
    sendEvent({
      action: "save",
      category: "character",
      label: "success",
    });
  };

  const handleGetShareLink = async () => {
    setFetching(true);

    const res = await fetch("/api/share/characters", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chars: owned.join(","),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      const url =
        "https://anados-collection-tracker.vercel.app/" +
        (locale ? locale + "/" : "") +
        "share/char/" +
        data.id;
      if (!isIos()) {
        try {
          await navigator.clipboard.writeText(url);
          TopToaster?.show({
            intent: "success",
            message: t("ui.message.copiedShareLink"),
          });
        } catch (e) {
          // 失敗したらiOSと同じ方法を取る
          setShareUrl(url);
        }
      } else {
        // iOSはclipboard.writeTextが使えない
        setShareUrl(url);
      }
      sendEvent({
        action: "share",
        category: "character",
        label: "success",
      });
    } else {
      TopToaster?.show({
        intent: "danger",
        message: data.message,
      });
      sendEvent({
        action: "share",
        category: "character",
        label: "failed",
      });
    }

    setFetching(false);
  };

  const handleClipboardCopy = () => {
    shareUrlElm.current?.select();
    document.execCommand("copy");
    setShareUrl("");
    TopToaster?.show({
      intent: "success",
      message: t("ui.message.copiedShareLink"),
    });
  };

  const handleCharImageDownload = () => {
    setOpenCaptureModal(true);
  };

  return (
    <Container titleLink="/">
      <div css={styles.main} className={flash ? "flash" : undefined}>
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
              value={filterDeployment}
              onChange={setFilterDeployment}
              options={[
                { value: "none", label: t("ui.filter.deploymentBy") },
                { value: "low", label: t("ui.filter.lowGround") },
                { value: "high", label: t("ui.filter.highGround") },
                { value: "both", label: t("ui.filter.bothGround") },
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
              value={filterRelease}
              onChange={setFilterRelease}
              options={[
                { value: "none", label: t("ui.filter.releaseBy") },
                { value: "2021", label: t("ui.filter.year2021") },
                { value: "2022", label: t("ui.filter.year2022") },
                { value: "2023", label: t("ui.filter.year2023") },
                { value: "2024", label: t("ui.filter.year2024") },
              ]}
            />

            <FilterSelect
              value={filterTicket}
              onChange={setFilterTicket}
              options={[
                { value: "none", label: t("ui.filter.ticketBy") },
                { value: "aniv1.0", label: t("ui.filter.aniv1.0") },
                { value: "aniv1.5", label: t("ui.filter.aniv1.5") },
                { value: "aniv2.0", label: t("ui.filter.aniv2.0") },
                { value: "aniv2.5", label: t("ui.filter.aniv2.5") },
                { value: "aniv3.0", label: t("ui.filter.aniv3.0") },
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
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={6}
            charInfo={rare6}
            hideSpoiler={hideSpoiler}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={5}
            charInfo={rare5}
            hideSpoiler={hideSpoiler}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={4}
            charInfo={rare4}
            hideSpoiler={hideSpoiler}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={3}
            charInfo={rare3}
            hideSpoiler={hideSpoiler}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={2}
            charInfo={rare2}
            hideSpoiler={hideSpoiler}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={1}
            charInfo={rare1}
            hideSpoiler={hideSpoiler}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={0}
            charInfo={rare0}
            hideSpoiler={hideSpoiler}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />

          <div
            className={scrolling ? "scrolling" : undefined}
            css={css`
              padding: 10px 15px;
              border-radius: 5px;
              display: flex;
              flex-direction: column;
              align-items: center;
              color: #d3d8de;
              position: sticky;
              bottom: 20px;
              background: rgba(17, 20, 24, 0.7);

              opacity: 1;
              visibility: visible;
              transition: opacity 0.5s, visibility 0.5s;

              &.scrolling {
                opacity: 0;
                visibility: hidden;
              }
            `}
          >
            {t("ui.text.overall")}
            <div
              css={css`
                color: #fff;
                font-size: 200%;
                font-weight: 600;
              `}
            >
              {Math.round((owned.length / props.charInfo.length) * 100)}%
            </div>
            <span>
              {owned.length} / {props.charInfo.length}
            </span>
          </div>
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
          <div>
            {shareUrl ? (
              <InputGroup
                css={css`
                  width: 180px;
                  border: 1px solid #5f6b7c;
                  border-radius: 2px;
                  direction: rtl;
                `}
                inputRef={shareUrlElm}
                value={shareUrl}
                readOnly
                rightElement={
                  <Tooltip
                    compact
                    content={t("ui.message.copyToClipboard")}
                    position="bottom-right"
                    defaultIsOpen={true}
                  >
                    <Button
                      css={css`
                        width: 40px;
                      `}
                      intent="success"
                      icon="clipboard"
                      onClick={handleClipboardCopy}
                    />
                  </Tooltip>
                }
              />
            ) : (
              <Button loading={fetching} onClick={handleGetShareLink}>
                {t("ui.button.getShareLink")}
              </Button>
            )}
          </div>
        </div>
        <Button onClick={handleCharImageDownload} outlined>
          {t("ui.button.downloadScreenshot")}
        </Button>
      </div>

      <CaptureModal
        isOpen={openCaptureModal}
        charInfo={props.charInfo}
        displayChars={[rare0, rare1, rare2, rare3, rare4, rare5, rare6, rare7]}
        owned={owned}
        hideSpoiler={hideSpoiler}
        onClose={() => setOpenCaptureModal(false)}
      />
    </Container>
  );
};

type CharacterAreaProps = {
  rarity: number;
  charInfo: CharInfo[];
  hideSpoiler: boolean;
  hideCheckBUtton?: boolean;
  onCharClick: (id: number) => void;
  onBulkRegister: (ids: number[]) => void;
};

export const CharacterArea: React.FC<CharacterAreaProps> = (props) => {
  const { t } = useTranslation("common");

  if (props.charInfo.length === 0) return null;

  const allOwned =
    props.charInfo.filter((x) => x.owned).length === props.charInfo.length;

  const handleBulkRegister = () => {
    if (allOwned) {
      // すべて所持している場合は、全部反転
      props.onBulkRegister(props.charInfo.map((x) => x.id));
    } else {
      // 未所持がある場合は、未所持のみ登録
      props.onBulkRegister(
        props.charInfo.filter((x) => !x.owned).map((x) => x.id)
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
            {props.charInfo.filter((x) => x.owned).length} /{" "}
            {props.charInfo.length}
          </span>
          {!props.hideCheckBUtton && (
            <Button
              outlined
              css={css`
                width: 6.3rem;
                font-size: 80%;
              `}
              onClick={handleBulkRegister}
            >
              {allOwned ? t("ui.button.uncheckAll") : t("ui.button.checkAll")}
            </Button>
          )}
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
        <CharacterList
          characters={props.charInfo}
          hideSpoiler={props.hideSpoiler}
          onCharClick={props.onCharClick}
        />
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async (context) => {
  const charInfo = loadCharactors();
  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common"])),
      charInfo,
    },
  };
};

export default Home;
