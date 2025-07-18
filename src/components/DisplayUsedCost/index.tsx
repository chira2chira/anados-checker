import { useState } from "react";
import { useTranslation } from "next-i18next";
import { Button } from "@blueprintjs/core";
import { getImageUrl } from "@/utils/image";

type DisplayUsedCostProps = {
  stone: number;
};

const UNIT_PRICE = 75.38; // 130個/9800JPY

export const DisplayUsedCost: React.FC<DisplayUsedCostProps> = (props) => {
  const [showStone, setShowStone] = useState(true);
  const { t } = useTranslation("gacha");
  return (
    <>
      {showStone ? (
        <>
          <span>
            {t("ui.text.usedStone")}: {props.stone}
          </span>
          <img
            src={getImageUrl("common/stone.png")}
            alt="龍脈石"
            width="15px"
            height="18px"
            style={{ margin: "0 3px 0 5px" }}
          />
        </>
      ) : (
        <span style={{ marginLeft: "3px" }}>
          {Math.round(props.stone * UNIT_PRICE).toLocaleString()}
          {t("ui.text.jpy")}
        </span>
      )}
      <Button
        icon="refresh"
        minimal
        small
        onClick={() => setShowStone(!showStone)}
      />
    </>
  );
};
