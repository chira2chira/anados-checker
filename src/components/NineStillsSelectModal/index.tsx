import { Dialog, DialogBody, InputGroup } from "@blueprintjs/core";
import { css } from "@emotion/react";
import { useTranslation } from "next-i18next";
import { useContext, useState } from "react";
import { CharInfoWithStill } from "@/types/unit";
import { StillInfo } from "@/types/still";
import { getImageUrl } from "@/utils/image";
import FilterSelect from "@/components/FilterSelect";
import { CustomLabelContext } from "@/providers/CustomLabelProvider";

type NineStillsSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (still: StillInfo) => void;
  charInfoWithStills: CharInfoWithStill[];
  selectedStillIds: string[];
};

export const NineStillsSelectModal: React.FC<NineStillsSelectModalProps> = (
  props,
) => {
  const { t, i18n } = useTranslation("nine-stills");
  const { t: tc } = useTranslation("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRate, setFilterRate] = useState("none");
  const { customLabels } = useContext(CustomLabelContext);

  const filteredChars = props.charInfoWithStills
    .filter((char) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        char.nameJa.toLowerCase().includes(query) ||
        char.nameEn.toLowerCase().includes(query)
      );
    })
    .map((char) => ({
      ...char,
      stills:
        filterRate === "none"
          ? char.stills
          : char.stills.filter((s) => s.rate === Number(filterRate)),
    }))
    .filter((char) => char.stills.length > 0);

  const groupedByRarity = [7, 6, 5, 4, 3, 2, 1, 0].map((rarity) => ({
    rarity,
    chars: filteredChars.filter((x) => x.rarity === rarity),
  }));

  const handleStillClick = (still: StillInfo) => {
    if (props.selectedStillIds.includes(still.id)) {
      return;
    }
    props.onSelect(still);
    props.onClose();
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={t("button.selectStill")}
      css={css`
        width: 90vw;
        max-width: 1200px;
        max-height: 80vh;
        padding-bottom: 0;
      `}
    >
      <DialogBody
        css={css`
          max-height: calc(80vh - 60px);
          overflow-y: auto;
        `}
      >
        <InputGroup
          type="search"
          placeholder={
            i18n.language === "ja"
              ? "キャラ名で検索"
              : "Search by character name"
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon="search"
          css={css`
            margin: auto;
            margin-bottom: 8px;
            width: 220px;
            position: sticky;
            top: 0;
            z-index: 10;
          `}
        />
        <div
          css={css`
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
          `}
        >
          <div
            css={css`
              width: 220px;
            `}
          >
            <FilterSelect
              value={filterRate}
              onChange={setFilterRate}
              options={[
                { value: "none", label: tc("ui.filter.userLabelBy") },
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
        </div>
        {groupedByRarity.map(({ rarity, chars }) => {
          if (chars.length === 0) return null;

          return (
            <div
              key={rarity}
              css={css`
                margin-bottom: 30px;
              `}
            >
              <div
                css={css`
                  display: flex;
                  flex-direction: column;
                  gap: 15px;
                `}
              >
                {chars.map((char) => {
                  if (char.stills.length === 0) return null;

                  const charName =
                    i18n.language === "ja" ? char.nameJa : char.nameEn;

                  return (
                    <div
                      key={char.id}
                      css={css`
                        display: flex;
                        gap: 10px;
                        align-items: flex-start;

                        @media (max-width: 992px) {
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                        }
                      `}
                    >
                      <div
                        css={css`
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          gap: 5px;
                          width: 100px;

                          @media (max-width: 992px) {
                            width: auto;
                          }
                        `}
                      >
                        <img
                          css={css`
                            width: 50px;
                            height: 50px;
                            border-radius: 25px;
                          `}
                          src={getImageUrl("char/" + char.image)}
                          alt={charName}
                        />
                        <div
                          css={css`
                            font-size: 85%;
                            text-align: center;
                            word-break: break-word;
                          `}
                        >
                          {charName}
                        </div>
                      </div>

                      <div
                        css={css`
                          display: flex;
                          flex-wrap: wrap;
                          gap: 8px;
                          flex: 1;

                          @media (max-width: 992px) {
                            justify-content: center;
                          }
                        `}
                      >
                        {char.stills.map((still) => {
                          const isSelected = props.selectedStillIds.includes(
                            still.id,
                          );

                          return (
                            <div
                              key={still.id}
                              css={css`
                                position: relative;
                                cursor: ${isSelected
                                  ? "not-allowed"
                                  : "pointer"};
                                opacity: ${isSelected ? 0.3 : 1};
                                transition: opacity 0.2s;

                                &:hover {
                                  opacity: ${isSelected ? 0.3 : 0.8};
                                }
                              `}
                              onClick={() => handleStillClick(still)}
                            >
                              <img
                                css={css`
                                  width: 144px;
                                  height: 81px;
                                  object-fit: cover;
                                  border-radius: 3px;
                                `}
                                src={getImageUrl("still/" + still.image)}
                                alt={still.label}
                              />
                              <div
                                css={css`
                                  position: absolute;
                                  bottom: 2px;
                                  left: 2px;
                                  background-color: rgba(0, 0, 0, 0.7);
                                  padding: 2px 6px;
                                  border-radius: 2px;
                                  font-size: 70%;
                                `}
                              >
                                {still.label}
                              </div>
                              {isSelected && (
                                <div
                                  css={css`
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    background-color: rgba(0, 0, 0, 0.5);
                                    border-radius: 3px;
                                  `}
                                >
                                  <span
                                    css={css`
                                      font-size: 120%;
                                      font-weight: bold;
                                      color: #fff;
                                    `}
                                  >
                                    ✓
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </DialogBody>
    </Dialog>
  );
};
