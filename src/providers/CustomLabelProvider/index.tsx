import React, { useEffect, useState } from "react";
import { INITIAL_LABELS } from "@/components/CustomLabelModal";
import { parseLocalStorageCustomLabel } from "@/utils/charUtil";

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
  const [customLabels, _setCustomLabels] = useState(INITIAL_LABELS);

  const setCustomLabels = (newValue: string[]) => {
    _setCustomLabels(newValue);
    window.localStorage.setItem(CLABEL_KEY, newValue.join(","));
  };

  useEffect(() => {
    // SSRを避けて取得する
    const storedValue = window.localStorage.getItem(CLABEL_KEY);
    if (storedValue) {
      setCustomLabels(parseLocalStorageCustomLabel(storedValue));
    }
  }, []);

  return (
    <CustomLabelContext.Provider value={{ customLabels, setCustomLabels }}>
      {props.children}
    </CustomLabelContext.Provider>
  );
};

export default CustomLabelProvider;
