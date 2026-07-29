import React, { useCallback, useMemo } from "react";
import { INITIAL_LABELS } from "@/components/CustomLabelModal";
import { parseLocalStorageCustomLabel } from "@/utils/charUtil";
import {
  useLocalStorageRaw,
  writeLocalStorage,
} from "@/utils/localStorageStore";

const CLABEL_KEY = "still_customlabel";

type CustomLabelProviderProps = {
  children?: React.ReactNode;
};

type CustomLabelContextProps = {
  customLabels: string[];
  setCustomLabels: (customLabels: string[]) => void;
};

export const CustomLabelContext = React.createContext<CustomLabelContextProps>(
  {} as CustomLabelContextProps
);

const CustomLabelProvider: React.FC<CustomLabelProviderProps> = (props) => {
  // 保存値をそのまま参照するため、ローカルstateは持たない
  const raw = useLocalStorageRaw(CLABEL_KEY);
  const customLabels = useMemo(
    () => (raw ? parseLocalStorageCustomLabel(raw) : INITIAL_LABELS),
    [raw]
  );

  const setCustomLabels = useCallback((newValue: string[]) => {
    writeLocalStorage(CLABEL_KEY, newValue.join(","));
  }, []);

  const value = useMemo(
    () => ({ customLabels, setCustomLabels }),
    [customLabels, setCustomLabels]
  );

  return (
    <CustomLabelContext.Provider value={value}>
      {props.children}
    </CustomLabelContext.Provider>
  );
};

export default CustomLabelProvider;
