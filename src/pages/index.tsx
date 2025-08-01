import * as styles from "@/styles/Home.module";
import { GetStaticProps, NextPage } from "next";
import { loadCharactors, loadEidosMaster } from "@/utils/yamlUtil";
import CharacterList from "@/components/CharacterList";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { css } from "@emotion/react";
import {
  Button,
  ButtonGroup,
  InputGroup,
  Switch,
  Tooltip,
} from "@blueprintjs/core";
import ClassButton from "@/components/ClassButton";
import FilterSelect from "@/components/FilterSelect";
import dayjs from "dayjs";
import { BottomRightToaster, TopToaster } from "@/utils/toast";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { sendEvent } from "@/utils/gtag";
import { isIos } from "@/utils/browser";
import { useScroll } from "@/hooks/useScroll";
import useCategoryQuery, { PageCategory } from "@/hooks/useCategoryQuery";
import { Container } from "@/components/Container";
import { CaptureModal } from "@/components/CaptureModal";
import { CharClass, CharInfo, EidosInfo, UnknownInfo } from "@/types/unit";
import { isCharInfo, isEidosInfo } from "@/utils/types";
import { HideSpoilerContext } from "@/providers/HideSpoilerProvider";
import useCharacterAndEidosOwnership from "@/hooks/useCharacterAndEidosOwnership";
import { getImageUrl } from "@/utils/image";

type HomeProps = {
  charInfo: CharInfo[];
  eidosInfo: EidosInfo[];
};

function filterClassChar(filter: CharClass[]) {
  return function (info: UnknownInfo) {
    if (!isCharInfo(info)) return true;

    return filter.length === 0 ? true : filter.includes(info.class);
  };
}

function filterOwnedChar(filter: string) {
  return function (char: UnknownInfo) {
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
  return function (info: UnknownInfo) {
    switch (filter) {
      case "none":
        return true;
      case "standard":
        return !info.limited;
      case "limited":
        return info.limited;
    }
  };
}

function filterDeploymentChar(filter: string) {
  return function (info: UnknownInfo) {
    if (!isCharInfo(info)) return true;

    switch (filter) {
      case "none":
        return true;
      case "low":
        return info.deployment === "low" || info.deployment === "both";
      case "high":
        return info.deployment === "high" || info.deployment === "both";
      case "both":
        return info.deployment === "both";
    }
  };
}

function filterReleaseChar(filter: string) {
  return function (info: UnknownInfo) {
    switch (filter) {
      case "none":
        return true;
      case "2021":
        return dayjs(info.release).year() === 2021;
      case "2022":
        return dayjs(info.release).year() === 2022;
      case "2023":
        return dayjs(info.release).year() === 2023;
      case "2024":
        return dayjs(info.release).year() === 2024;
      case "2025":
        return dayjs(info.release).year() === 2025;
    }
  };
}
const INELIGIBLE_CHAR = ["Gaia", "Barboros", "New Look Barboros"];
function filterTicketChar(filter: string) {
  return function (info: UnknownInfo) {
    if (!isCharInfo(info)) return true;

    switch (filter) {
      case "none":
        return true;
      case "aniv0.5":
        // https://anothereidos-r.info/news/pnote201/
        if (INELIGIBLE_CHAR.includes(info.nameEn)) return false;
        return (
          info.rarity >= 4 && dayjs(info.release).isBefore(dayjs("2022/6/24"))
        );
      case "aniv1.0":
        // https://anothereidos-r.info/news/pnote1209/
        if (INELIGIBLE_CHAR.includes(info.nameEn)) return false;
        return (
          info.rarity >= 4 &&
          (info.limited
            ? dayjs(info.release).isBefore(dayjs("2022/6/25"))
            : dayjs(info.release).isBefore(dayjs("2022/9/30")))
        );
      case "aniv1.5":
        // https://anothereidos-r.info/news/1-5anniv2023/
        if (INELIGIBLE_CHAR.includes(info.nameEn)) return false;
        return (
          info.rarity >= 4 &&
          (info.limited
            ? dayjs(info.release).isBefore(dayjs("2022/12/24"))
            : dayjs(info.release).isBefore(dayjs("2023/6/23")))
        );
      case "aniv2.0":
        // https://anothereidos-r.info/news/casino_01/
        if (INELIGIBLE_CHAR.includes(info.nameEn)) return false;
        return (
          info.rarity >= 4 &&
          (info.limited
            ? dayjs(info.release).isBefore(dayjs("2023/6/25"))
            : dayjs(info.release).isBefore(dayjs("2023/12/23")))
        );
      case "aniv2.5":
        // https://anothereidos-r.info/news/2-5anniv2024/
        if (INELIGIBLE_CHAR.includes(info.nameEn)) return false;
        return (
          info.rarity >= 4 &&
          (info.limited
            ? dayjs(info.release).isBefore(dayjs("2023/12/23"))
            : dayjs(info.release).isBefore(dayjs("2024/6/22")))
        );
      case "aniv3.0":
        // https://anothereidos-r.info/news/winterdate/
        if (INELIGIBLE_CHAR.includes(info.nameEn)) return false;
        return (
          info.rarity >= 4 &&
          (info.limited
            ? dayjs(info.release).isBefore(dayjs("2024/6/29"))
            : dayjs(info.release).isBefore(dayjs("2024/11/16")))
        );
      case "aniv3.5":
        // https://anothereidos-r.info/news/3-5aniv2025/
        if (INELIGIBLE_CHAR.includes(info.nameEn)) return false;
        return (
          info.rarity >= 4 &&
          (info.limited
            ? dayjs(info.release).isBefore(dayjs("2024/12/14"))
            : dayjs(info.release).isBefore(dayjs("2025/6/7")))
        );
    }
  };
}

const INELIGIBLE_EIDOS = ["Dummy"];
function filterTicketEidos(filter: string) {
  return function (info: UnknownInfo) {
    if (!isEidosInfo(info)) return true;

    switch (filter) {
      case "none":
        return true;
      case "aniv3.5":
        // https://anothereidos-r.info/news/3-5aniv2025/
        if (INELIGIBLE_EIDOS.includes(info.nameEn)) return false;
        return (
          info.rarity >= 4 && dayjs(info.release).isBefore(dayjs("2025/4/26"))
        );
    }
  };
}

const Home: NextPage<HomeProps> = (props) => {
  const { owned, setOwned, save, tmpMode } = useCharacterAndEidosOwnership();
  const [filterClass, setFilterClass] = useState<CharClass[]>([]);
  const [filterOwned, setFilterOwned] = useState("none");
  const [filterLimited, setFilterLimited] = useState("none");
  const [filterDeployment, setFilterDeployment] = useState("none");
  const [filterRelease, setFilterRelease] = useState("none");
  const [filterTicket, setFilterTicket] = useState("none");
  const [filterEidosTicket, setFilterEidosTicket] = useState("none");
  const [fetching, setFetching] = useState(false);
  const [flash, setFlash] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [openCaptureModal, setOpenCaptureModal] = useState(false);
  const { hideSpoiler, setHideSpoiler } = useContext(HideSpoilerContext);
  const shareUrlElm = useRef<HTMLInputElement>(null);
  const { asPath, locale, push } = useRouter();
  const category = useCategoryQuery();
  const currentInfo: UnknownInfo[] =
    category === "char" ? props.charInfo : props.eidosInfo;
  const currentOwned = category === "char" ? owned.char : owned.eidos;
  const scrolling = useScroll();
  const { t } = useTranslation("common");

  useEffect(() => {
    setFlash(true);

    setTimeout(() => {
      setFlash(false);
    }, 0);
  }, [asPath]);

  useEffect(() => {
    if (tmpMode) {
      BottomRightToaster?.show({
        intent: "warning",
        timeout: 0,
        isCloseButtonShown: false,
        message: t("ui.message.viewingShared"),
        action: {
          icon: "cross",
          onClick: () => {
            push({ pathname: "/" });
          },
        },
      });
    } else {
      BottomRightToaster?.clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, tmpMode]); // pushすると再発火してしまうためpushはdepsに入れない

  // クリーンアップ
  useEffect(() => {
    return () => {
      BottomRightToaster?.clear();
    };
  }, []);

  const { rare0, rare1, rare2, rare3, rare4, rare5, rare6, rare7 } =
    useMemo(() => {
      const applyFilter = (rarity: number) =>
        currentInfo
          .filter((x) => x.rarity === rarity)
          .map((x) => ({ ...x, owned: currentOwned.includes(x.id) }))
          .filter(filterClassChar(filterClass))
          .filter(filterOwnedChar(filterOwned))
          .filter(filterLimitedChar(filterLimited))
          .filter(filterDeploymentChar(filterDeployment))
          .filter(filterReleaseChar(filterRelease))
          .filter(filterTicketChar(filterTicket))
          .filter(filterTicketEidos(filterEidosTicket));
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
      currentInfo,
      currentOwned,
      filterClass,
      filterOwned,
      filterLimited,
      filterDeployment,
      filterRelease,
      filterTicket,
      filterEidosTicket,
    ]);

  const handleCharClick = useCallback(
    (id: number) => {
      setOwned((x) => {
        let newState = category === "char" ? x.char : x.eidos;
        if (newState.includes(id)) {
          newState = newState.filter((y) => y !== id);
          if (category === "char") {
            return { ...x, char: newState };
          } else {
            return { ...x, eidos: newState };
          }
        } else {
          newState = [...newState, id];
          if (category === "char") {
            return { ...x, char: newState };
          } else {
            return { ...x, eidos: newState };
          }
        }
      });
    },
    [category, setOwned]
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
    save();
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
        chars: owned.char.join(","),
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
        <ButtonGroup
          css={css`
            margin-bottom: 40px;
          `}
        >
          <SwitchButton currentCategory={category} linkCategory="char" />
          <SwitchButton currentCategory={category} linkCategory="eidos" />
        </ButtonGroup>

        <div
          css={css`
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          `}
        >
          {category === "char" && (
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
          )}

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
              style={{ display: category === "char" ? undefined : "none" }}
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
                { value: "2025", label: t("ui.filter.year2025") },
              ]}
            />
            <FilterSelect
              style={{ display: category === "char" ? undefined : "none" }}
              value={filterTicket}
              onChange={setFilterTicket}
              options={[
                { value: "none", label: t("ui.filter.ticketBy") },
                { value: "aniv1.0", label: t("ui.filter.aniv1.0") },
                { value: "aniv1.5", label: t("ui.filter.aniv1.5") },
                { value: "aniv2.0", label: t("ui.filter.aniv2.0") },
                { value: "aniv2.5", label: t("ui.filter.aniv2.5") },
                { value: "aniv3.0", label: t("ui.filter.aniv3.0") },
                { value: "aniv3.5", label: t("ui.filter.aniv3.5") },
              ]}
            />
            <FilterSelect
              style={{ display: category === "eidos" ? undefined : "none" }}
              value={filterEidosTicket}
              onChange={setFilterEidosTicket}
              options={[
                { value: "none", label: t("ui.filter.equipmentTicketBy") },
                { value: "aniv3.5", label: t("ui.filter.aniv3.5Eidos") },
              ]}
            />
          </div>

          <Switch
            checked={hideSpoiler}
            label={t("ui.button.spoilerFilter")}
            onChange={() => {
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
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={6}
            charInfo={rare6}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={5}
            charInfo={rare5}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={4}
            charInfo={rare4}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={3}
            charInfo={rare3}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={2}
            charInfo={rare2}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={1}
            charInfo={rare1}
            onCharClick={handleCharClick}
            onBulkRegister={handleBulkRegister}
          />
          <CharacterArea
            rarity={0}
            charInfo={rare0}
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
              bottom: ${tmpMode ? "60px" : "20px"};
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
              {Math.round((currentOwned.length / currentInfo.length) * 100)}%
            </div>
            <span>
              {currentOwned.length} / {currentInfo.length}
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
          {category === "char" && (
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
          )}
        </div>
        <Button onClick={handleCharImageDownload} outlined>
          {t("ui.button.downloadScreenshot")}
        </Button>
      </div>

      <CaptureModal
        isOpen={openCaptureModal}
        charInfo={currentInfo}
        displayChars={[rare0, rare1, rare2, rare3, rare4, rare5, rare6, rare7]}
        owned={currentOwned}
        onClose={() => setOpenCaptureModal(false)}
      />
    </Container>
  );
};

type SwitchButtonProps = {
  currentCategory: PageCategory;
  linkCategory: PageCategory;
};

const SwitchButton: React.FC<SwitchButtonProps> = (props) => {
  const { t } = useTranslation("common");
  const { push } = useRouter();
  const label =
    props.linkCategory === "char"
      ? t("ui.button.character")
      : t("ui.button.eidos");

  const handleClick = () => {
    if (props.currentCategory === props.linkCategory) return;
    push({ pathname: "/", query: { cat: props.linkCategory } });
  };

  return (
    <Button
      onClick={handleClick}
      intent={
        props.currentCategory === props.linkCategory ? "primary" : undefined
      }
    >
      {label}
    </Button>
  );
};

type CharacterAreaProps = {
  rarity: number;
  charInfo: UnknownInfo[];
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
          onCharClick={props.onCharClick}
        />
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async (context) => {
  const charInfo = loadCharactors();
  const eidosInfo = loadEidosMaster();
  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common"])),
      charInfo,
      eidosInfo,
    },
  };
};

export default Home;
